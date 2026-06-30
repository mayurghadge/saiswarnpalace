require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true
  }
};

console.log('🔌 Testing SQL Connection...');
console.log('DB Server:', config.server);
console.log('DB Name:', config.database);
console.log('DB User:', config.user);

async function testConnection() {
  try {
    await sql.connect(config);
    console.log('✅ SUCCESS: Connected to SQL Server!');
    
    // Test query
    const result = await sql.query`SELECT GETDATE() as CurrentTime`;
    console.log('🕐 Database Time:', result.recordset[0].CurrentTime);
    
    // Check Users table exists
    try {
      await sql.query`SELECT TOP 1 * FROM Users`;
      console.log('✅ Users table exists!');
    } catch {
      console.log('⚠️ Users table not found - run the database schema!');
    }
    
    await sql.close();
    console.log('✅ Connection closed!');
  } catch (err) {
    console.error('❌ SQL Connection Error:', err);
    console.error('Full Error:', JSON.stringify(err, null, 2));
  }
}

testConnection();
