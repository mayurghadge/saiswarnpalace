
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB, sql } = require('./config/db');

async function checkOrdersTable() {
  try {
    const pool = await connectDB();
    
    // Get all columns in Orders table
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Orders'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📊 Orders Table Columns:');
    console.table(columnsResult.recordset);
    
    // Get existing orders (if any)
    const ordersResult = await pool.request().query(`
      SELECT TOP 5 * FROM Orders
    `);
    
    console.log('\n📋 First 5 Orders (if any):');
    console.table(ordersResult.recordset);
    
    await pool.close();
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkOrdersTable();
