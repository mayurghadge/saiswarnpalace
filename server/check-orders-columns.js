
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB, sql } = require('./config/db');

async function checkOrdersColumns() {
  try {
    const pool = await connectDB();
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Orders'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('Orders table columns:');
    console.table(columns.recordset);

    const sample = await pool.request().query('SELECT TOP 3 * FROM Orders');
    console.log('Sample order rows:');
    console.table(sample.recordset);

    await pool.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkOrdersColumns();
