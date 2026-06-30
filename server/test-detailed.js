const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'JewelleryDB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Sspnp@277369',
  port: 1433,
  driver: 'tedious',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: false,
    enableArithAbort: true,
    connectionTimeout: 15000,
    requestTimeout: 30000,
    tdsVersion: '7_1',  // Try older TDS version
  }
};

async function test() {
  console.log('=== Detailed Connection Test ===');
  console.log('Config:', JSON.stringify({
    server: dbConfig.server,
    database: dbConfig.database,
    user: dbConfig.user,
    port: dbConfig.port,
    driver: dbConfig.driver,
  }, null, 2));
  
  try {
    console.log('\nAttempting connection...');
    const pool = await sql.connect(dbConfig);
    
    console.log('✅ Connected successfully!');
    
    // Try a simple query
    const result = await pool.request().query('SELECT GETDATE() as CurrentTime, @@SERVERNAME as ServerName');
    console.log('✅ Query successful!');
    console.log('Result:', result.recordset[0]);
    
    await pool.close();
    console.log('✅ Connection closed.');
  } catch (error) {
    console.error('\n❌ Connection FAILED');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.originalError) {
      console.error('\nOriginal Error:');
      console.error('  Type:', error.originalError.constructor.name);
      console.error('  Message:', error.originalError.message);
      console.error('  Code:', error.originalError.code);
    }
    
    console.error('\nFull error object:');
    console.error(error);
  }
}

test();
