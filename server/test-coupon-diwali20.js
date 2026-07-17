
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB, sql } = require('./config/db');

async function test() {
  try {
    const pool = await connectDB();
    const normalizedCode = 'DIWALI20'.toUpperCase().trim();
    console.log('Testing normalizedCode:', normalizedCode);

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

    console.log('Result recordset:', result.recordset);
    console.log('Coupon found:', result.recordset.length > 0);
    await pool.close();
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
