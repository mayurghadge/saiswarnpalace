
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB, sql } = require('./config/db');

async function test() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM Coupons');
    console.log('All coupons:');
    console.table(result.recordset);
    
    if (result.recordset.length > 0) {
      const coupon = result.recordset[0];
      console.log('\nFirst coupon keys:', Object.keys(coupon));
      console.log('First coupon values:', Object.values(coupon));
      console.log('Code value:', coupon.Code);
      console.log('Code type:', typeof coupon.Code);
    }

    await pool.close();
  } catch (err) {
    console.error(err);
  }
}
test();
