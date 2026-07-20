const { connectDB, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const fallbackAdminEmail = (process.env.ADMIN_EMAIL || 'admin@saiswarnpalace.com').toLowerCase();
const fallbackAdminPassword = process.env.ADMIN_PASSWORD || 'Ssp@277369';

const createAdminToken = (admin) => jwt.sign(
  { id: admin?.id || 1, email: admin?.email || fallbackAdminEmail, role: 'admin' },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '7d' }
);

const isFallbackAdminLogin = (email = '', password = '') => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  return (
    (normalizedEmail === fallbackAdminEmail || normalizedEmail === 'admin@saiswarnpalace' || normalizedEmail === 'admin') &&
    normalizedPassword === fallbackAdminPassword
  );
};

exports.isFallbackAdminLogin = isFallbackAdminLogin;

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

async function ensureCouponsTable(pool) {
  await pool.request().query(`
    IF OBJECT_ID('Coupons', 'U') IS NULL
    BEGIN
      CREATE TABLE Coupons (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL,
        discount_type NVARCHAR(20) NOT NULL,
        discount_value DECIMAL(18,2) NOT NULL,
        min_order_value DECIMAL(18,2) NULL,
        max_discount DECIMAL(18,2) NULL,
        usage_limit INT NULL,
        used_count INT NOT NULL DEFAULT 0,
        valid_from DATETIME NULL,
        valid_to DATETIME NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE()
      )
    END
  `);
}

async function ensureProductExtraColumns(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ItemCode')
    BEGIN
      ALTER TABLE Products ADD ItemCode NVARCHAR(100) NULL
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'HUIDHallmark')
    BEGIN
      ALTER TABLE Products ADD HUIDHallmark NVARCHAR(100) NULL
    END
  `);
}

const normalizeCouponCode = (code = '') => String(code).trim().toUpperCase();
const optionalDecimal = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const requiredDecimal = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const optionalInt = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const optionalDate = (value, endOfDay = false) => {
  if (!value) return null;
  const normalizedValue = endOfDay ? `${value}T23:59:59.997` : `${value}T00:00:00.000`;
  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// CATEGORIES CRUD
exports.getCategories = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT
        Id AS id,
        Name AS name,
        ImageURL AS image,
        LOWER(REPLACE(Name, ' ', '-')) AS slug,
        GETDATE() AS created_at
      FROM Categories
      ORDER BY Name ASC
    `);
    res.status(200).json({ categories: result.recordset });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    let imagePath = req.body.image || '';
    
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'jewellery/categories'
      });
      imagePath = result.secure_url;
      
      // Delete temporary file
      fs.unlinkSync(req.file.path);
    }
    
    const pool = await connectDB();
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('image', sql.NVarChar, imagePath)
      .query(`
        INSERT INTO Categories (Name, ImageURL)
        OUTPUT inserted.*
        VALUES (@name, @image)
      `);
    
    res.status(201).json({ message: 'Category created successfully', category: result.recordset[0] });
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    let imagePath = req.body.image || '';
    
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'jewellery/categories'
      });
      imagePath = result.secure_url;
      
      // Delete temporary file
      fs.unlinkSync(req.file.path);
    }
    
    const pool = await connectDB();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('image', sql.NVarChar, imagePath)
      .query(`
        UPDATE Categories 
        SET Name = @name, ImageURL = @image
        WHERE Id = @id
      `);
    
    res.status(200).json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Categories WHERE Id = @id');
    
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PRODUCTS CRUD (update, delete)
exports.createProduct = async (req, res) => {
  try {
    const {
      name, description, price, discount_price, category_id, material, weight,
      purity, making_charges, wastage_percentage, diamond_price, stock, is_featured,
      item_code, huid_hallmark, style, gender, occasion, collection, metal_color, metalColor,
      fixed_making_charge, fixedMakingCharge, other_charges, otherCharges, discount_percentage, discountPercentage, is_active
    } = req.body;
    let imagesPath = req.body.images || '';
    
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'jewellery/products'
      });
      imagesPath = result.secure_url;
      
      // Delete temporary file
      fs.unlinkSync(req.file.path);
    }
    
    const pool = await connectDB();
    await ensureProductExtraColumns(pool);

    // Resolve CategoryId safely
    let finalCategoryId = null;
    if (category_id) {
      if (/^\d+$/.test(String(category_id))) {
        finalCategoryId = parseInt(category_id, 10);
      } else {
        const catResult = await pool.request()
          .input('catName', sql.NVarChar, String(category_id).trim())
          .query('SELECT Id FROM Categories WHERE Name = @catName OR Slug = LOWER(REPLACE(@catName, \' \', \'-\'))');
        if (catResult.recordset.length > 0) {
          finalCategoryId = catResult.recordset[0].Id;
        }
      }
    }

    let isAvailable = 1;
    if (is_active !== undefined) {
      isAvailable = (is_active === 'true' || is_active === true || is_active === '1' || is_active === 1) ? 1 : 0;
    } else if (stock !== undefined) {
      isAvailable = Number(stock) > 0 ? 1 : 0;
    }
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || '')
      .input('categoryId', sql.Int, finalCategoryId)
      .input('weight', sql.Decimal(10,2), weight || 0)
      .input('purity', sql.NVarChar, purity || '')
      .input('wastagePercentage', sql.Decimal(5,2), wastage_percentage || 0)
      .input('makingCharges', sql.Decimal(18,2), making_charges || 0)
      .input('fixedMakingCharge', sql.Decimal(18,2), fixed_making_charge || fixedMakingCharge || 0)
      .input('itemCode', sql.NVarChar, item_code || null)
      .input('huidHallmark', sql.NVarChar, huid_hallmark || null)
      .input('imageUrl', sql.NVarChar, imagesPath)
      .input('isAvailable', sql.Bit, isAvailable)
      .input('material', sql.NVarChar, material || null)
      .input('style', sql.NVarChar, style || null)
      .input('gender', sql.NVarChar, gender || null)
      .input('occasion', sql.NVarChar, occasion || null)
      .input('collection', sql.NVarChar, collection || null)
      .input('metalColor', sql.NVarChar, metal_color || metalColor || null)
      .input('diamondPrice', sql.Decimal(18,2), diamond_price || 0)
      .input('otherCharges', sql.Decimal(18,2), other_charges || otherCharges || 0)
      .input('discountPercentage', sql.Decimal(5,2), discount_percentage || discountPercentage || 0)
      .query(`
        INSERT INTO Products (
          Name, Description, CategoryId, Weight, Purity, WastagePercentage, MakingChargesPerGram, 
          FixedMakingCharge, ItemCode, HUIDHallmark, ImageURL, IsAvailable,
          Material, Style, Gender, Occasion, Collection, MetalColor, DiamondPrice, OtherCharges, DiscountPercentage
        )
        OUTPUT inserted.*
        VALUES (
          @name, @description, @categoryId, @weight, @purity, @wastagePercentage, @makingCharges, 
          @fixedMakingCharge, @itemCode, @huidHallmark, @imageUrl, @isAvailable,
          @material, @style, @gender, @occasion, @collection, @metalColor, @diamondPrice, @otherCharges, @discountPercentage
        )
      `);
    
    res.status(201).json({ message: 'Product created successfully', product: result.recordset[0] });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, price, discount_price, category_id, material, weight,
      purity, making_charges, wastage_percentage, diamond_price, stock, is_featured, is_active,
      item_code, huid_hallmark, style, gender, occasion, collection, metal_color, metalColor,
      fixed_making_charge, fixedMakingCharge, other_charges, otherCharges, discount_percentage, discountPercentage
    } = req.body;
    let imagesPath = req.body.images || '';
    
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'jewellery/products'
      });
      imagesPath = result.secure_url;
      
      // Delete temporary file
      fs.unlinkSync(req.file.path);
    }
    
    const pool = await connectDB();
    await ensureProductExtraColumns(pool);

    // Resolve CategoryId safely
    let finalCategoryId = null;
    if (category_id) {
      if (/^\d+$/.test(String(category_id))) {
        finalCategoryId = parseInt(category_id, 10);
      } else {
        const catResult = await pool.request()
          .input('catName', sql.NVarChar, String(category_id).trim())
          .query('SELECT Id FROM Categories WHERE Name = @catName OR Slug = LOWER(REPLACE(@catName, \' \', \'-\'))');
        if (catResult.recordset.length > 0) {
          finalCategoryId = catResult.recordset[0].Id;
        }
      }
    }

    let isAvailable = 1;
    if (is_active !== undefined) {
      isAvailable = (is_active === 'true' || is_active === true || is_active === '1' || is_active === 1) ? 1 : 0;
    } else if (stock !== undefined) {
      isAvailable = Number(stock) > 0 ? 1 : 0;
    }
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || '')
      .input('categoryId', sql.Int, finalCategoryId)
      .input('weight', sql.Decimal(10,2), weight || 0)
      .input('purity', sql.NVarChar, purity || '')
      .input('wastagePercentage', sql.Decimal(5,2), wastage_percentage || 0)
      .input('makingCharges', sql.Decimal(18,2), making_charges || 0)
      .input('fixedMakingCharge', sql.Decimal(18,2), fixed_making_charge || fixedMakingCharge || 0)
      .input('itemCode', sql.NVarChar, item_code || null)
      .input('huidHallmark', sql.NVarChar, huid_hallmark || null)
      .input('imageUrl', sql.NVarChar, imagesPath)
      .input('isAvailable', sql.Bit, isAvailable)
      .input('material', sql.NVarChar, material || null)
      .input('style', sql.NVarChar, style || null)
      .input('gender', sql.NVarChar, gender || null)
      .input('occasion', sql.NVarChar, occasion || null)
      .input('collection', sql.NVarChar, collection || null)
      .input('metalColor', sql.NVarChar, metal_color || metalColor || null)
      .input('diamondPrice', sql.Decimal(18,2), diamond_price || 0)
      .input('otherCharges', sql.Decimal(18,2), other_charges || otherCharges || 0)
      .input('discountPercentage', sql.Decimal(5,2), discount_percentage || discountPercentage || 0)
      .query(`
        UPDATE Products 
        SET Name = @name,
            Description = @description,
            CategoryId = @categoryId,
            Weight = @weight,
            Purity = @purity,
            WastagePercentage = @wastagePercentage,
            MakingChargesPerGram = @makingCharges,
            FixedMakingCharge = @fixedMakingCharge,
            ItemCode = @itemCode,
            HUIDHallmark = @huidHallmark,
            ImageURL = @imageUrl,
            IsAvailable = @isAvailable,
            Material = @material,
            Style = @style,
            Gender = @gender,
            Occasion = @occasion,
            Collection = @collection,
            MetalColor = @metalColor,
            DiamondPrice = @diamondPrice,
            OtherCharges = @otherCharges,
            DiscountPercentage = @discountPercentage,
            UpdatedAt = GETDATE()
        WHERE Id = @id
      `);
    
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Products WHERE id = @id');
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// COUPONS CRUD
exports.getCoupons = async (req, res) => {
  try {
    const pool = await connectDB();
    await ensureCouponsTable(pool);
    const result = await pool.request().query(`
      SELECT id, code, discount_type, discount_value, min_order_value, max_discount,
             usage_limit, used_count, valid_from, valid_to, is_active, created_at
      FROM Coupons
      ORDER BY created_at DESC, id DESC
    `);
    res.status(200).json({ coupons: result.recordset });
  } catch (error) {
    console.error('Get Coupons Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const {
      code, discount_type, discount_value, min_order_value, max_discount,
      usage_limit, valid_from, valid_to, is_active
    } = req.body;
    const pool = await connectDB();
    await ensureCouponsTable(pool);
    
    const result = await pool.request()
      .input('code', sql.NVarChar, normalizeCouponCode(code))
      .input('discount_type', sql.NVarChar, discount_type)
      .input('discount_value', sql.Decimal(18, 2), requiredDecimal(discount_value, 0))
      .input('min_order_value', sql.Decimal(18, 2), optionalDecimal(min_order_value))
      .input('max_discount', sql.Decimal(18, 2), optionalDecimal(max_discount))
      .input('usage_limit', sql.Int, optionalInt(usage_limit))
      .input('valid_from', sql.DateTime, optionalDate(valid_from, false))
      .input('valid_to', sql.DateTime, optionalDate(valid_to, true))
      .input('is_active', sql.Bit, is_active !== undefined ? is_active : 1)
      .query(`
        INSERT INTO Coupons (
          code, discount_type, discount_value, min_order_value, max_discount,
          usage_limit, valid_from, valid_to, is_active
        )
        OUTPUT inserted.*
        VALUES (
          @code, @discount_type, @discount_value, @min_order_value, @max_discount,
          @usage_limit, @valid_from, @valid_to, @is_active
        )
      `);
    
    res.status(201).json({ message: 'Coupon created successfully', coupon: result.recordset[0] });
  } catch (error) {
    console.error('Create Coupon Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code, discount_type, discount_value, min_order_value, max_discount,
      usage_limit, valid_from, valid_to, is_active
    } = req.body;
    const pool = await connectDB();
    await ensureCouponsTable(pool);
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('code', sql.NVarChar, normalizeCouponCode(code))
      .input('discount_type', sql.NVarChar, discount_type)
      .input('discount_value', sql.Decimal(18, 2), requiredDecimal(discount_value, 0))
      .input('min_order_value', sql.Decimal(18, 2), optionalDecimal(min_order_value))
      .input('max_discount', sql.Decimal(18, 2), optionalDecimal(max_discount))
      .input('usage_limit', sql.Int, optionalInt(usage_limit))
      .input('valid_from', sql.DateTime, optionalDate(valid_from, false))
      .input('valid_to', sql.DateTime, optionalDate(valid_to, true))
      .input('is_active', sql.Bit, is_active !== undefined ? is_active : 1)
      .query(`
        UPDATE Coupons 
        SET code = @code, discount_type = @discount_type, discount_value = @discount_value,
            min_order_value = @min_order_value, max_discount = @max_discount,
            usage_limit = @usage_limit, valid_from = @valid_from, valid_to = @valid_to,
            is_active = @is_active
        WHERE id = @id
      `);
    
    res.status(200).json({ message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Update Coupon Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    await ensureCouponsTable(pool);
    
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Coupons WHERE id = @id');
    
    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete Coupon Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const fallbackLogin = isFallbackAdminLogin(email, password);

    // The login page displays these configured emergency credentials.  They
    // must remain usable even when an older Admins row has a different stored
    // password, otherwise the database row incorrectly masks the fallback.
    if (fallbackLogin) {
      const token = createAdminToken({ id: 1, email: fallbackAdminEmail, name: 'Admin' });
      return res.status(200).json({
        message: 'Login successful',
        token,
        admin: { id: 1, name: 'Admin', email: fallbackAdminEmail }
      });
    }

    try {
      const pool = await connectDB();
      let admin = null;

      try {
        const result = await pool.request()
          .input('email', sql.NVarChar, email)
          .query('SELECT * FROM Admins WHERE email = @email');

        if (result.recordset.length > 0) {
          admin = result.recordset[0];
        }
      } catch (dbError) {
        console.error('Admin Login DB Error:', dbError);
        if (fallbackLogin) {
          const token = createAdminToken({ id: 1, email, name: 'Admin' });
          return res.status(200).json({
            message: 'Login successful',
            token,
            admin: { id: 1, name: 'Admin', email }
          });
        }
        return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
      }

      if (!admin) {
        if (fallbackLogin) {
          const token = createAdminToken({ id: 1, email, name: 'Admin' });
          return res.status(200).json({
            message: 'Login successful',
            token,
            admin: { id: 1, name: 'Admin', email }
          });
        }

        return res.status(404).json({ message: 'Admin not found' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      const isPlainTextMatch = admin.password && String(admin.password) === String(password);
      if (!isMatch && !isPlainTextMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = createAdminToken(admin);

      res.status(200).json({
        message: 'Login successful',
        token,
        admin: { id: admin.id, name: admin.name, email: admin.email }
      });
    } catch (dbError) {
      console.error('Admin Login DB Error:', dbError);
      if (fallbackLogin) {
        const token = createAdminToken({ id: 1, email, name: 'Admin' });
        return res.status(200).json({
          message: 'Login successful',
          token,
          admin: { id: 1, name: 'Admin', email }
        });
      }
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const pool = await connectDB();
    await ensureVerificationDocumentsTable(pool);
    const result = await pool.request().query(`
      SELECT 
        u.Id AS id,
        u.FullName AS name,
        u.Email AS email,
        u.Phone AS phone,
        COALESCE(v.status, CASE WHEN u.IsIdentityVerified = 1 THEN 'approved' ELSE 'not verified' END) AS verification_status,
        u.CreatedAt AS created_at,
        COUNT(DISTINCT o.Id) AS orders_count
      FROM Users u
      OUTER APPLY (
        SELECT TOP 1 status
        FROM UserVerificationDocuments
        WHERE user_id = u.Id
        ORDER BY created_at DESC, id DESC
      ) v
      LEFT JOIN Orders o ON u.Id = o.UserId
      GROUP BY u.Id, u.FullName, u.Email, u.Phone, u.IsIdentityVerified, u.CreatedAt, v.status
      ORDER BY u.CreatedAt DESC
    `);
    res.status(200).json({ users: result.recordset });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's verification proofs
exports.getUserProofs = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    await ensureVerificationDocumentsTable(pool);

    const userResult = await pool.request()
      .input('userId', sql.Int, id)
      .query('SELECT FullName AS name, Email AS email, Phone AS phone FROM Users WHERE Id = @userId');

    const result = await pool.request()
      .input('userId', sql.Int, id)
      .query('SELECT * FROM UserVerificationDocuments WHERE user_id = @userId ORDER BY created_at DESC, id DESC');
    const proofs = result.recordset;

    res.status(200).json({
      user: userResult.recordset[0],
      proofs
    });
  } catch (error) {
    console.error('Get User Proofs Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve user verification
exports.approveProof = async (req, res) => {
  try {
    const { id, proofId } = req.params; // userId and proofId
    const { notes } = req.body;
    const adminId = req.user.id; // assuming admin is authenticated

    const pool = await connectDB();
    await ensureVerificationDocumentsTable(pool);

    await pool.request()
      .input('userId', sql.Int, id)
      .query('UPDATE Users SET IsIdentityVerified = 1 WHERE Id = @userId');

    await pool.request()
      .input('proofId', sql.Int, proofId)
      .input('adminId', sql.Int, adminId)
      .input('notes', sql.NVarChar, notes || '')
      .query(`
        UPDATE UserVerificationDocuments 
        SET status = 'approved', reviewed_by = @adminId, reviewed_at = GETDATE(), review_notes = @notes
        WHERE id = @proofId
      `);

    res.status(200).json({ message: 'Proof approved successfully' });
  } catch (error) {
    console.error('Approve Proof Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject user verification
exports.rejectProof = async (req, res) => {
  try {
    const { id, proofId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const pool = await connectDB();
    await ensureVerificationDocumentsTable(pool);

    await pool.request()
      .input('userId', sql.Int, id)
      .query('UPDATE Users SET IsIdentityVerified = 0 WHERE Id = @userId');

    await pool.request()
      .input('proofId', sql.Int, proofId)
      .input('adminId', sql.Int, adminId)
      .input('notes', sql.NVarChar, notes || '')
      .query(`
        UPDATE UserVerificationDocuments 
        SET status = 'rejected', reviewed_by = @adminId, reviewed_at = GETDATE(), review_notes = @notes
        WHERE id = @proofId
      `);

    res.status(200).json({ message: 'Proof rejected successfully' });
  } catch (error) {
    console.error('Reject Proof Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Users WHERE Id = @id');
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all products for admin
exports.getAdminProducts = async (req, res) => {
  try {
    const pool = await connectDB();
    await ensureProductExtraColumns(pool);
    const result = await pool.request().query(`
      SELECT 
        p.Id AS id,
        p.Name AS name,
        p.Description AS description,
        p.CategoryId AS category_id,
        p.Weight AS weight,
        p.Purity AS purity,
        p.WastagePercentage AS wastage_percentage,
        p.MakingChargesPerGram AS making_charges,
        p.FixedMakingCharge AS fixed_making_charge,
        p.ItemCode AS item_code,
        p.HUIDHallmark AS huid_hallmark,
        p.IsAvailable AS is_active,
        p.ImageURL AS images,
        p.CreatedAt AS created_at,
        p.Material AS material,
        p.Style AS style,
        p.Gender AS gender,
        p.Occasion AS occasion,
        p.Collection AS collection,
        p.MetalColor AS metal_color,
        p.DiamondPrice AS diamond_price,
        p.OtherCharges AS other_charges,
        p.DiscountPercentage AS discount_percentage,
        c.Name AS category_name
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryId = c.Id
      ORDER BY p.CreatedAt DESC
    `);
    res.status(200).json({ products: result.recordset });
  } catch (error) {
    console.error('Get Admin Products Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
        o.Id AS id,
        CONCAT('ORD-', o.Id) AS order_number,
        o.UserId AS user_id,
        o.TotalAmount AS subtotal,
        CAST(0 AS DECIMAL(18,2)) AS discount,
        CAST(0 AS DECIMAL(18,2)) AS tax,
        o.TotalAmount AS total,
        o.Status AS order_status,
        o.CreatedAt AS created_at,
        u.FullName AS user_name,
        u.Email AS user_email,
        u.Phone AS user_phone
      FROM Orders o
      LEFT JOIN Users u ON o.UserId = u.Id
      ORDER BY o.CreatedAt DESC
    `);
    res.status(200).json({ orders: result.recordset });
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    
    const orderResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          o.Id AS id,
          CONCAT('ORD-', o.Id) AS order_number,
          o.UserId AS user_id,
          o.TotalAmount AS subtotal,
          CAST(0 AS DECIMAL(18,2)) AS discount,
          CAST(0 AS DECIMAL(18,2)) AS tax,
          o.TotalAmount AS total,
          o.Status AS order_status,
          o.CreatedAt AS created_at,
          u.FullName AS user_name,
          u.Email AS user_email,
          u.Phone AS user_phone
        FROM Orders o
        LEFT JOIN Users u ON o.UserId = u.Id
        WHERE o.Id = @id
      `);
    
    if (orderResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const itemsResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          oi.Id AS id,
          oi.OrderId AS order_id,
          oi.ProductId AS product_id,
          oi.Quantity AS quantity,
          oi.PriceAtTime AS price,
          p.Name AS product_name,
          p.ImageURL AS product_image
        FROM OrderItems oi
        LEFT JOIN Products p ON oi.ProductId = p.Id
        WHERE oi.OrderId = @id
      `);
    
    res.status(200).json({
      order: orderResult.recordset[0],
      items: itemsResult.recordset
    });
  } catch (error) {
    console.error('Get Order Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;
    
    const pool = await connectDB();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('order_status', sql.NVarChar, order_status)
      .query(`
        UPDATE Orders 
        SET Status = @order_status
        WHERE Id = @id
      `);
    
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get contact inquiries
exports.getContacts = async (req, res) => {
  try {
    const pool = await connectDB();
    const check = await pool.request().query("SELECT OBJECT_ID('Contacts') AS table_id");
    if (!check.recordset[0]?.table_id) {
      return res.status(200).json({ contacts: [] });
    }
    const result = await pool.request().query(`SELECT * FROM Contacts ORDER BY created_at DESC`);
    res.status(200).json({ contacts: result.recordset || [] });
  } catch (error) {
    console.error('Get Contacts Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const pool = await connectDB();
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .query('UPDATE Contacts SET status = @status WHERE id = @id');
    
    res.status(200).json({ message: 'Contact status updated successfully' });
  } catch (error) {
    console.error('Update Contact Status Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update gold rates
exports.updateGoldRates = async (req, res) => {
  try {
    const {
      gold_rate_18k,
      gold_rate_22k,
      gold_rate_24k,
      silver_rate,
      gst_rate,
      wastage_rate
    } = req.body;
    
    const pool = await connectDB();

    const ratesToUpsert = [
      { purity: '18K', rate: gold_rate_18k },
      { purity: '22K', rate: gold_rate_22k },
      { purity: '24K', rate: gold_rate_24k },
      { purity: 'SILVER', rate: silver_rate }
    ];

    for (const item of ratesToUpsert) {
      if (item.rate === undefined || item.rate === null || item.rate === '') {
        continue;
      }

      await pool.request()
        .input('purity', sql.NVarChar, item.purity)
        .input('rate', sql.Decimal(18, 2), Number(item.rate) || 0)
        .query(`
          IF EXISTS (SELECT 1 FROM GoldRates WHERE Purity = @purity)
          BEGIN
            UPDATE GoldRates
            SET RatePerGram = @rate, UpdatedAt = GETDATE()
            WHERE Purity = @purity
          END
          ELSE
          BEGIN
            INSERT INTO GoldRates (Purity, RatePerGram)
            VALUES (@purity, @rate)
          END
        `);
    }
    
    res.status(200).json({ message: 'Gold & Silver rates updated successfully' });
  } catch (error) {
    console.error('Update Gold Rates Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const pool = await connectDB();
    
    const [ordersResult, productsResult, usersResult, goldRatesResult] = await Promise.all([
      pool.request().query('SELECT COUNT(*) as count FROM Orders'),
      pool.request().query('SELECT COUNT(*) as count FROM Products WHERE IsAvailable = 1'),
      pool.request().query('SELECT COUNT(*) as count FROM Users'),
      pool.request().query(`
        SELECT
          MAX(CASE WHEN Purity = '18K' THEN RatePerGram END) AS gold_rate_18k,
          MAX(CASE WHEN Purity = '22K' THEN RatePerGram END) AS gold_rate_22k,
          MAX(CASE WHEN Purity = '24K' THEN RatePerGram END) AS gold_rate_24k,
          MAX(CASE WHEN Purity = 'SILVER' THEN RatePerGram END) AS silver_rate,
          CAST(3 AS DECIMAL(18,2)) AS gst_rate,
          CAST(12 AS DECIMAL(18,2)) AS wastage_rate,
          MAX(UpdatedAt) AS updated_at
        FROM GoldRates
      `)
    ]);
    
    res.status(200).json({
      totalOrders: ordersResult.recordset[0].count,
      totalProducts: productsResult.recordset[0].count,
      totalUsers: usersResult.recordset[0].count,
      goldRates: goldRatesResult.recordset[0] || {}
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Sales and user reports (dates are calculated in India Standard Time)
exports.getReports = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      DECLARE @TodayIST DATE = CAST(DATEADD(MINUTE, 330, GETUTCDATE()) AS DATE);

      SELECT
        COALESCE(SUM(CASE
          WHEN CAST(DATEADD(MINUTE, 330, CreatedAt) AS DATE) = @TodayIST
           AND LOWER(COALESCE(Status, '')) NOT IN ('cancelled', 'refunded')
          THEN TotalAmount ELSE 0 END), 0) AS today_sales,
        SUM(CASE
          WHEN CAST(DATEADD(MINUTE, 330, CreatedAt) AS DATE) = @TodayIST
          THEN 1 ELSE 0 END) AS today_orders,
        COALESCE(SUM(CASE
          WHEN LOWER(COALESCE(Status, '')) NOT IN ('cancelled', 'refunded')
          THEN TotalAmount ELSE 0 END), 0) AS total_sales,
        COUNT(*) AS total_orders
      FROM Orders;

      SELECT COUNT(*) AS total_users FROM Users;

      SELECT TOP 30
        CAST(DATEADD(MINUTE, 330, CreatedAt) AS DATE) AS report_date,
        COUNT(*) AS order_count,
        SUM(CASE WHEN LOWER(COALESCE(Status, '')) NOT IN ('cancelled', 'refunded')
          THEN 1 ELSE 0 END) AS sale_orders,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(Status, '')) NOT IN ('cancelled', 'refunded')
          THEN TotalAmount ELSE 0 END), 0) AS sales_amount
      FROM Orders
      GROUP BY CAST(DATEADD(MINUTE, 330, CreatedAt) AS DATE)
      ORDER BY report_date DESC;

      SELECT
        u.Id AS user_id,
        u.FullName AS user_name,
        u.Email AS user_email,
        u.Phone AS user_phone,
        COUNT(o.Id) AS order_count,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(o.Status, '')) NOT IN ('cancelled', 'refunded')
          THEN o.TotalAmount ELSE 0 END), 0) AS total_spent,
        MAX(o.CreatedAt) AS last_order_at
      FROM Users u
      LEFT JOIN Orders o ON o.UserId = u.Id
      GROUP BY u.Id, u.FullName, u.Email, u.Phone
      ORDER BY total_spent DESC, order_count DESC, u.FullName;
    `);

    const summary = result.recordsets[0]?.[0] || {};
    const usersSummary = result.recordsets[1]?.[0] || {};
    res.status(200).json({
      summary: { ...summary, total_users: usersSummary.total_users || 0 },
      dailyReports: result.recordsets[2] || [],
      userReports: result.recordsets[3] || []
    });
  } catch (error) {
    console.error('Get Reports Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
