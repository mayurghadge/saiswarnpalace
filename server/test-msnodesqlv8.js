const sql = require('mssql');

// Simple config without encryption
const config = {
  server: 'mayur',
  database: 'JewelleryDB',
  user: 'sa',
  password: 'Sspnp@277369',
  driver: 'msnodesqlv8',
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
  }
};

async function test() {
  try {
    console.log('Testing simple config without encryption...');
    
    const pool = await sql.connect(config);
    console.log('✅ Connected successfully!');
    
    const result = await pool.request().query('SELECT GETDATE() as CurrentTime');
    console.log('Query result:', result.recordset[0]);
    
    await pool.close();
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.originalError) {
      console.error('Original error:', error.originalError.message);
    }
  }
}

test();
