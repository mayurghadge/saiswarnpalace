const { connectDB, sql } = require('../config/db');

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

const normalizeCouponCode = (code = '') => String(code).trim().toUpperCase();

const applyCoupon = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    const pool = await connectDB();
    await ensureCouponsTable(pool);
    const normalizedCode = normalizeCouponCode(code);
    const orderTotal = Number(totalAmount) || 0;

    if (!normalizedCode) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const result = await pool.request()
      .input('code', sql.NVarChar, normalizedCode)
      .query(`
        SELECT TOP 1 *
        FROM Coupons 
        WHERE UPPER(LTRIM(RTRIM(code))) = @code
        ORDER BY id DESC
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Coupon code not found' });
    }

    const coupon = result.recordset[0];

    if (!coupon.is_active) {
      return res.status(400).json({ message: 'This coupon is inactive' });
    }

    if (coupon.valid_from && new Date() < new Date(coupon.valid_from)) {
      return res.status(400).json({ message: 'This coupon is not active yet' });
    }

    if (coupon.valid_to) {
      const validUntil = new Date(coupon.valid_to);
      validUntil.setHours(23, 59, 59, 999);
      if (new Date() > validUntil) {
        return res.status(400).json({ message: 'This coupon has expired' });
      }
    }

    if (coupon.usage_limit && Number(coupon.usage_limit) > 0 && Number(coupon.used_count || 0) >= Number(coupon.usage_limit)) {
      return res.status(400).json({ message: 'This coupon usage limit has been reached' });
    }

    if (coupon.min_order_value && orderTotal < Number(coupon.min_order_value)) {
      return res.status(400).json({ 
        message: `Minimum order value of ₹${coupon.min_order_value} required` 
      });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'FIXED') {
      discountAmount = coupon.discount_value;
    } else if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (orderTotal * coupon.discount_value) / 100;
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    }

    res.json({
      success: true,
      coupon,
      discountAmount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { applyCoupon };
