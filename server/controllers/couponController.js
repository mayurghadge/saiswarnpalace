const { connectDB, sql } = require('../config/db');

// ===============================
// Ensure Coupons table exists
// ===============================
async function ensureCouponsTable(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Coupons')
    BEGIN
      CREATE TABLE Coupons (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL,
        Discount_Type NVARCHAR(20) NOT NULL,
        Discount_Value DECIMAL(18,2) NOT NULL,
        Min_Order_Value DECIMAL(18,2) NULL,
        Max_Discount DECIMAL(18,2) NULL,
        Usage_Limit INT NULL,
        Used_Count INT NOT NULL DEFAULT 0,
        Valid_From DATETIME NULL,
        Valid_To DATETIME NULL,
        Is_Active BIT NOT NULL DEFAULT 1,
        Created_At DATETIME NOT NULL DEFAULT GETDATE()
      )
    END
  `);
}

// ===============================
// Apply Coupon
// ===============================
exports.applyCoupon = async (req, res) => {
  try {
    console.log('Apply coupon request body:', req.body);
    const { code, totalAmount } = req.body;
    if (!code || !totalAmount) {
      return res.status(400).json({ message: 'Coupon code and total amount are required' });
    }

    const pool = await connectDB();
    await ensureCouponsTable(pool);
    
    const normalizedCode = code.toUpperCase().trim();
    console.log('Normalized code:', normalizedCode);

    const result = await pool.request()
      .input('code', sql.NVarChar, normalizedCode)
      .query(`
        SELECT TOP 1 
          Id AS id,
          Code AS code,
          Discount_Type AS discount_type,
          Discount_Value AS discount_value,
          Min_Order_Value AS min_order_value,
          Max_Discount AS max_discount,
          Usage_Limit AS usage_limit,
          Used_Count AS used_count,
          Valid_From AS valid_from,
          Valid_To AS valid_to,
          Is_Active AS is_active,
          Created_At AS created_at
        FROM Coupons 
        WHERE UPPER(LTRIM(RTRIM(Code))) = @code
        ORDER BY Id DESC
      `);

    console.log('Query result rows:', result.recordset.length);
    console.log('Query result recordset:', JSON.stringify(result.recordset, null, 2));

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Coupon code not found' });
    }

    const coupon = result.recordset[0];
    console.log("Coupon from DB:", coupon);
    console.log("is_active =", coupon.is_active);
    console.log("valid_from =", coupon.valid_from);
    console.log("valid_to =", coupon.valid_to);
    console.log("usage_limit =", coupon.usage_limit);
    console.log("used_count =", coupon.used_count);
    console.log('Coupon found:', JSON.stringify(coupon, null, 2));
    const now = new Date();

    // Validate coupon
    if (!coupon.is_active) {
      return res.status(400).json({ message: 'This coupon is inactive' });
    }

    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return res.status(400).json({ message: 'This coupon is not yet valid' });
    }

    if (coupon.valid_to && new Date(coupon.valid_to) < now) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    if (coupon.min_order_value && parseFloat(totalAmount) < parseFloat(coupon.min_order_value)) {
      return res.status(400).json({ 
        message: `Minimum order value is ₹${coupon.min_order_value} to apply this coupon` 
      });
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: 'This coupon has reached its usage limit' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (parseFloat(totalAmount) * parseFloat(coupon.discount_value)) / 100;
      if (coupon.max_discount) {
        discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount));
      }
    } else if (coupon.discount_type === 'FIXED') {
      discountAmount = parseFloat(coupon.discount_value);
    }

    console.log('Calculated discount:', discountAmount);

    res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value),
        min_order_value: coupon.min_order_value ? parseFloat(coupon.min_order_value) : null,
        max_discount: coupon.max_discount ? parseFloat(coupon.max_discount) : null,
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round((parseFloat(totalAmount) - discountAmount) * 100) / 100
    });
  } catch (err) {
    console.error('Apply coupon error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ===============================
// Get All Coupons (Admin)
// ===============================
exports.getAllCoupons = async (req, res) => {
  try {
    const pool = await connectDB();
    await ensureCouponsTable(pool);
    const result = await pool.request().query(`
      SELECT 
        Id AS id,
        Code AS code,
        Discount_Type AS discount_type,
        Discount_Value AS discount_value,
        Min_Order_Value AS min_order_value,
        Max_Discount AS max_discount,
        Usage_Limit AS usage_limit,
        Used_Count AS used_count,
        Valid_From AS valid_from,
        Valid_To AS valid_to,
        Is_Active AS is_active,
        Created_At AS created_at
      FROM Coupons 
      ORDER BY Created_At DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Get coupons error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ===============================
// Create Coupon (Admin)
// ===============================
exports.createCoupon = async (req, res) => {
  try {
    const { 
      code, 
      discount_type, 
      discount_value, 
      min_order_value, 
      max_discount, 
      usage_limit, 
      valid_from, 
      valid_to, 
      is_active = 1 
    } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ message: 'Code, discount type, and discount value are required' });
    }

    const pool = await connectDB();
    await ensureCouponsTable(pool);

    const result = await pool.request()
      .input('code', sql.NVarChar, code.toUpperCase().trim())
      .input('discount_type', sql.NVarChar, discount_type.toUpperCase())
      .input('discount_value', sql.Decimal(18, 2), discount_value)
      .input('min_order_value', sql.Decimal(18, 2), min_order_value || null)
      .input('max_discount', sql.Decimal(18, 2), max_discount || null)
      .input('usage_limit', sql.Int, usage_limit || null)
      .input('valid_from', sql.DateTime, valid_from || null)
      .input('valid_to', sql.DateTime, valid_to || null)
      .input('is_active', sql.Bit, is_active)
      .query(`
        INSERT INTO Coupons (
          Code, Discount_Type, Discount_Value, Min_Order_Value, Max_Discount, 
          Usage_Limit, Valid_From, Valid_To, Is_Active
        ) 
        OUTPUT INSERTED.Id, INSERTED.Created_At
        VALUES (
          @code, @discount_type, @discount_value, @min_order_value, @max_discount,
          @usage_limit, @valid_from, @valid_to, @is_active
        )
      `);

    res.status(201).json({
      success: true,
      coupon: {
        id: result.recordset[0].Id,
        code: code.toUpperCase().trim(),
        discount_type: discount_type.toUpperCase(),
        discount_value: parseFloat(discount_value),
        min_order_value: min_order_value ? parseFloat(min_order_value) : null,
        max_discount: max_discount ? parseFloat(max_discount) : null,
        usage_limit: usage_limit,
        valid_from: valid_from,
        valid_to: valid_to,
        is_active: is_active,
        created_at: result.recordset[0].Created_At
      }
    });
  } catch (err) {
    console.error('Create coupon error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ===============================
// Update Coupon (Admin)
// ===============================
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      code, 
      discount_type, 
      discount_value, 
      min_order_value, 
      max_discount, 
      usage_limit, 
      valid_from, 
      valid_to, 
      is_active 
    } = req.body;

    const pool = await connectDB();
    await ensureCouponsTable(pool);

    let updateQuery = 'UPDATE Coupons SET ';
    const params = [];

    if (code) {
      updateQuery += 'Code = @code, ';
      params.push({ name: 'code', value: code.toUpperCase().trim(), type: sql.NVarChar });
    }
    if (discount_type) {
      updateQuery += 'Discount_Type = @discount_type, ';
      params.push({ name: 'discount_type', value: discount_type.toUpperCase(), type: sql.NVarChar });
    }
    if (discount_value) {
      updateQuery += 'Discount_Value = @discount_value, ';
      params.push({ name: 'discount_value', value: discount_value, type: sql.Decimal(18, 2) });
    }
    if (min_order_value !== undefined) {
      updateQuery += 'Min_Order_Value = @min_order_value, ';
      params.push({ name: 'min_order_value', value: min_order_value || null, type: sql.Decimal(18, 2) });
    }
    if (max_discount !== undefined) {
      updateQuery += 'Max_Discount = @max_discount, ';
      params.push({ name: 'max_discount', value: max_discount || null, type: sql.Decimal(18, 2) });
    }
    if (usage_limit !== undefined) {
      updateQuery += 'Usage_Limit = @usage_limit, ';
      params.push({ name: 'usage_limit', value: usage_limit || null, type: sql.Int });
    }
    if (valid_from !== undefined) {
      updateQuery += 'Valid_From = @valid_from, ';
      params.push({ name: 'valid_from', value: valid_from || null, type: sql.DateTime });
    }
    if (valid_to !== undefined) {
      updateQuery += 'Valid_To = @valid_to, ';
      params.push({ name: 'valid_to', value: valid_to || null, type: sql.DateTime });
    }
    if (is_active !== undefined) {
      updateQuery += 'Is_Active = @is_active, ';
      params.push({ name: 'is_active', value: is_active, type: sql.Bit });
    }

    // Remove trailing comma
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ' WHERE Id = @id';
    params.push({ name: 'id', value: id, type: sql.Int });

    const request = pool.request();
    params.forEach(param => {
      if (param.type) {
        request.input(param.name, param.type, param.value);
      } else {
        request.input(param.name, param.value);
      }
    });

    await request.query(updateQuery);

    res.json({
      success: true,
      message: 'Coupon updated successfully'
    });
  } catch (err) {
    console.error('Update coupon error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ===============================
// Delete Coupon (Admin)
// ===============================
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    await ensureCouponsTable(pool);

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Coupons WHERE Id = @id');

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (err) {
    console.error('Delete coupon error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
