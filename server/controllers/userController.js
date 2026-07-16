const { connectDB, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Demo OTP store for local development since Users table has no OTP columns.
const otpStore = new Map();

function getUserColumnMap() {
  return {
    id: 'id',
    name: 'name',
    email: 'email',
    phone: 'phone',
    password: 'password',
    isVerified: 'is_verified',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
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
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('password', sql.NVarChar, hashedPassword)
      .query(`
        INSERT INTO Users (name, email, phone, password, is_verified)
        OUTPUT inserted.id AS id, inserted.name AS name, inserted.email AS email, inserted.phone AS phone, inserted.created_at AS created_at
        VALUES (@name, @email, @phone, @password, 0)
      `);
    
    const user = result.recordset[0];
    
    // Store OTP in-memory for demo mode.
    otpStore.set(email.toLowerCase(), { otp, expiresAt: otpExpiry.getTime() });

    // Log OTP for demo purposes
    console.log(`🔐 OTP for ${email}: ${otp}`);
    
    res.status(201).json({
      message: 'User registered successfully. Please verify OTP.',
      userId: user.id,
      otp // In production, don't send OTP in response
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
    
    // Update user as verified
    await pool.request()
      .input('userId', sql.Int, user.id)
      .query(`
        UPDATE Users
        SET ${getUserColumnMap().isVerified} = 1
        WHERE ${getUserColumnMap().id} = @userId
      `);

    otpStore.delete(email.toLowerCase());
    
    // Generate JWT token
    const token = jwt.sign(
{
    id: user.id,
    email: user.email,
    role: 'user'
},
process.env.JWT_SECRET,
{ expiresIn: '7d' }
)
    
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
          ${columns.isVerified} AS is_identity_verified
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
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
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
