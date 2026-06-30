const sql = require('mssql');

const dbConfig = {
  server: 'mayur',
  database: 'JewelleryDB',
  user: 'sa',
  password: 'Sspnp@277369',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

async function testConnection() {
  try {
    console.log('🔌 Connecting to SQL Server...');
    await sql.connect(dbConfig);
    console.log('✅ SUCCESS: Connected to SQL Server!');
    
    const result = await sql.query`SELECT GETDATE() as CurrentTime`;
    console.log('📅 Database Time:', result.recordset[0].CurrentTime);
    
    await sql.close();
    console.log('🔌 Connection closed.');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
