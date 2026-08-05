const { connectDB, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

// Demo OTP store for local development since Users table has no OTP columns.
const otpStore = new Map();

function getUserColumnMap() {
  return {
    id: 'Id',
    name: 'FullName',
    email: 'Email',
    phone: 'Phone',
    password: 'Password',
    isIdentityVerified: 'IsIdentityVerified',
    createdAt: 'CreatedAt',
  };
}

function buildAuthErrorResponse(error) {
  const message = error?.message || '';
  const isAzureSqlFirewallIssue = /Cannot open server|not allowed to access the server|firewall|Client with IP address/i.test(message);

  return {
    statusCode: isAzureSqlFirewallIssue ? 503 : 500,
    payload: {
      message: isAzureSqlFirewallIssue ? 'Database connection unavailable' : 'Server error',
      error: isAzureSqlFirewallIssue
        ? 'Azure SQL is currently blocking this request. Please allow the backend IP in the Azure firewall or restore database connectivity before trying again.'
        : message,
    },
  };
}

async function ensureVerificationDocumentsTable(pool) {
  await pool.request().query(`
    IF OBJECT_ID('UserVerificationDocuments', 'U') IS NULL
    BEGIN
      CREATE TABLE UserVerificationDocuments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        document_type NVARCHAR(50) NOT NULL,
        document_number NVARCHAR(100) NULL,
        document_path NVARCHAR(500) NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        reviewed_by INT NULL,
        reviewed_at DATETIME NULL,
        review_notes NVARCHAR(500) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        uploaded_at DATETIME NOT NULL DEFAULT GETDATE()
      )
    END
  `);
}

async function ensureRefreshTokensTable(pool) {
  await pool.request().query(`
    IF OBJECT_ID('RefreshTokens', 'U') IS NULL
    BEGIN
      CREATE TABLE RefreshTokens (
        id INT IDENTITY(1,1) PRIMARY KEY,
        token_id NVARCHAR(100) NOT NULL,
        token_hash NVARCHAR(500) NOT NULL,
        user_id INT NOT NULL,
        expires_at DATETIME NOT NULL,
        revoked BIT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        ip_address NVARCHAR(100) NULL,
        user_agent NVARCHAR(300) NULL
      )
    END
  `);
}

const REFRESH_TOKEN_DAYS = 30;

async function createRefreshTokenRow(pool, userId, req) {
  const tokenId = uuidv4();
  const tokenValue = crypto.randomBytes(64).toString('hex');
  const tokenHash = await bcrypt.hash(tokenValue, 10);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  await pool.request()
    .input('tokenId', sql.NVarChar, tokenId)
    .input('tokenHash', sql.NVarChar, tokenHash)
    .input('userId', sql.Int, userId)
    .input('expiresAt', sql.DateTime, expiresAt)
    .input('ip', sql.NVarChar, req.ip || null)
    .input('ua', sql.NVarChar, req.get('User-Agent') || null)
    .query(`
      INSERT INTO RefreshTokens (token_id, token_hash, user_id, expires_at, ip_address, user_agent)
      VALUES (@tokenId, @tokenHash, @userId, @expiresAt, @ip, @ua)
    `);

  return `${tokenId}:${tokenValue}`;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    path: '/',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
  };
}

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Name, email, phone and password are required' });
    }
    
    const pool = await connectDB();
    const columns = getUserColumnMap();
    
    // Check if user already exists
    const checkResult = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`SELECT ${columns.id} AS id FROM Users WHERE ${columns.email} = @email`);
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate OTP (for demo purposes, in production use SMS service)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Insert user
    const result = await pool.request()
      .input('fullName', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('password', sql.NVarChar, hashedPassword)
      .query(`
        INSERT INTO Users (FullName, Email, Phone, Password, IsIdentityVerified)
        OUTPUT inserted.Id AS id, inserted.FullName AS name, inserted.Email AS email, inserted.Phone AS phone, inserted.CreatedAt AS created_at
        VALUES (@fullName, @email, @phone, @password, 0)
      `);
    
    const user = result.recordset[0];
    
    // Store OTP in-memory for demo mode (do NOT expose OTP in responses).
    otpStore.set(email.toLowerCase(), { otp, expiresAt: otpExpiry.getTime() });

    console.log(`🔐 OTP generated for ${email} (demo only)`);

    res.status(201).json({
      message: 'User registered successfully. Please verify OTP.',
      userId: user.id
    });
    
  } catch (error) {
    console.error('Registration Error:', error);
    const { statusCode, payload } = buildAuthErrorResponse(error);
    res.status(statusCode).json(payload);
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    
    const pool = await connectDB();
    
    const columns = getUserColumnMap();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT
          ${columns.id} AS id,
          ${columns.name} AS name,
          ${columns.email} AS email,
          ${columns.phone} AS phone
        FROM Users
        WHERE ${columns.email} = @email
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.recordset[0];
    const otpData = otpStore.get(email.toLowerCase());
    
    if (!otpData || otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: 'OTP expired' });
    }
    
    // Keep verification state in memory for this session.
    otpStore.delete(email.toLowerCase());
    
    // Generate JWT token (short-lived)
    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, JWT_SECRET || 'dev-secret', { expiresIn: ACCESS_TOKEN_EXPIRES });
    // Create refresh token row and set HttpOnly cookie
    try {
      await ensureRefreshTokensTable(pool);
      const refreshCookie = await createRefreshTokenRow(pool, user.id, req);
      res.cookie('refreshToken', refreshCookie, cookieOptions());
    } catch (e) {
      console.warn('Failed to create refresh token row', e.message || e);
    }

    res.status(200).json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
    
  } catch (error) {
    console.error('OTP Verification Error:', error);
    const { statusCode, payload } = buildAuthErrorResponse(error);
    res.status(statusCode).json(payload);
  }
};

// Login with email and password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const pool = await connectDB();
    
    const columns = getUserColumnMap();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT
          ${columns.id} AS id,
          ${columns.name} AS name,
          ${columns.email} AS email,
          ${columns.phone} AS phone,
          ${columns.password} AS password_hash,
          ${columns.isIdentityVerified} AS is_identity_verified
        FROM Users
        WHERE ${columns.email} = @email
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.recordset[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token (short-lived)
    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, JWT_SECRET || 'dev-secret', { expiresIn: ACCESS_TOKEN_EXPIRES });
    // Create and set refresh token cookie
    try {
      await ensureRefreshTokensTable(pool);
      const refreshCookie = await createRefreshTokenRow(pool, user.id, req);
      res.cookie('refreshToken', refreshCookie, cookieOptions());
    } catch (e) {
      console.warn('Failed to create refresh token row', e.message || e);
    }

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
    
  } catch (error) {
    console.error('Login Error:', error);
    const { statusCode, payload } = buildAuthErrorResponse(error);
    res.status(statusCode).json(payload);
  }
};

// Get user profile
exports.buildAuthErrorResponse = buildAuthErrorResponse;
exports.getUserColumnMap = getUserColumnMap;

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const pool = await connectDB();
    await ensureVerificationDocumentsTable(pool);

    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          u.Id AS id,
          u.FullName AS name,
          u.Email AS email,
          u.Phone AS phone,
          COALESCE(v.status, CASE WHEN u.IsIdentityVerified = 1 THEN 'approved' ELSE 'not verified' END) AS verification_status,
          u.CreatedAt AS created_at
        FROM Users u
        OUTER APPLY (
          SELECT TOP 1 status
          FROM UserVerificationDocuments
          WHERE user_id = u.Id
          ORDER BY created_at DESC, id DESC
        ) v
        WHERE u.Id = @userId
      `);
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.recordset[0];
    
    // Get verification proof
    const proofResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM UserVerificationDocuments WHERE user_id = @userId ORDER BY created_at DESC, id DESC');
    
    res.status(200).json({ 
      user,
      proofs: proofResult.recordset 
    });
    
  } catch (error) {
    console.error('Get Profile Error:', error);
    const { statusCode, payload } = buildAuthErrorResponse(error);
    res.status(statusCode).json(payload);
  }
};

// Submit verification proof
exports.submitVerificationProof = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType, documentNumber } = req.body;
    let documentPath = null;
    
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'jewellery/verifications',
        resource_type: 'auto' // To support both images and PDFs
      });
      documentPath = result.secure_url;
      
      // Delete temporary file
      fs.unlinkSync(req.file.path);
    } else {
      return res.status(400).json({ message: 'Please upload proof document' });
    }

    const pool = await connectDB();
    await ensureVerificationDocumentsTable(pool);
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('documentType', sql.NVarChar, documentType)
      .input('documentNumber', sql.NVarChar, documentNumber || '')
      .input('documentPath', sql.NVarChar, documentPath)
      .query(`
        INSERT INTO UserVerificationDocuments (user_id, document_type, document_number, document_path)
        OUTPUT inserted.*
        VALUES (@userId, @documentType, @documentNumber, @documentPath)
      `);
    
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('UPDATE Users SET IsIdentityVerified = 0 WHERE Id = @userId');

    res.status(201).json({ 
      message: 'Proof submitted!', proof: result.recordset[0] });
    
  } catch (error) {
    console.error('Submit Proof Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Refresh access token using refresh token cookie
exports.refreshToken = async (req, res) => {
  try {
    const cookie = req.cookies?.refreshToken;
    if (!cookie) return res.status(401).json({ message: 'No refresh token' });

    const [tokenId, tokenValue] = cookie.split(':');
    if (!tokenId || !tokenValue) return res.status(401).json({ message: 'Invalid refresh token format' });

    const pool = await connectDB();
    await ensureRefreshTokensTable(pool);

    const q = await pool.request()
      .input('tokenId', sql.NVarChar, tokenId)
      .query('SELECT TOP 1 * FROM RefreshTokens WHERE token_id = @tokenId AND revoked = 0');

    if (q.recordset.length === 0) return res.status(401).json({ message: 'Refresh token not found' });

    const row = q.recordset[0];
    if (new Date(row.expires_at) < new Date()) return res.status(401).json({ message: 'Refresh token expired' });

    const match = await bcrypt.compare(tokenValue, row.token_hash);
    if (!match) return res.status(401).json({ message: 'Refresh token invalid' });

    // Optional binding checks to reduce replay risk
    const strictBinding = process.env.REFRESH_TOKEN_BINDING_STRICT === 'true';
    if (strictBinding) {
      const ipStored = (row.ip_address || '').toString();
      const uaStored = (row.user_agent || '').toString();
      const ipNow = (req.ip || '').toString();
      const uaNow = (req.get('User-Agent') || '').toString();

      if (ipStored && ipStored !== ipNow) {
        return res.status(401).json({ message: 'Refresh token bound to a different IP' });
      }

      if (uaStored && uaStored !== '' && !uaNow.startsWith(uaStored.split(' ').slice(0,3).join(' '))) {
        // Basic prefix check on UA to allow minor variations
        return res.status(401).json({ message: 'Refresh token bound to a different client' });
      }
    }

    // Token valid — rotate: revoke old token and create a new one
    await pool.request().input('id', sql.Int, row.id).query('UPDATE RefreshTokens SET revoked = 1 WHERE id = @id');

    const newCookie = await createRefreshTokenRow(pool, row.user_id, req);

    // Issue new access token
    const accessToken = jwt.sign({ id: row.user_id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', newCookie, cookieOptions());

    return res.json({ token: accessToken });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Logout: revoke refresh token and clear cookie
exports.logout = async (req, res) => {
  try {
    const cookie = req.cookies?.refreshToken;
    if (cookie) {
      const [tokenId] = cookie.split(':');
      if (tokenId) {
        const pool = await connectDB();
        await ensureRefreshTokensTable(pool);
        await pool.request().input('tokenId', sql.NVarChar, tokenId).query('UPDATE RefreshTokens SET revoked = 1 WHERE token_id = @tokenId');
      }
    }

    res.clearCookie('refreshToken', cookieOptions());
    return res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
