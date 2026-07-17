
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB, sql } = require('./config/db');

async function checkCoupons() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM Coupons');
    console.log('Coupons in DB:');
    console.table(result.recordset);
    await pool.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCoupons();
