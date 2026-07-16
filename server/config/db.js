const sql = require('mssql');
require('dotenv').config();

const dbDriver = process.env.DB_DRIVER || 'tedious';

const dbConfig = {
  server: process.env.DB_SERVER || 'saiswarnserver2026.database.windows.net',
  database: process.env.DB_NAME || 'SaiSwarnPalace',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Sspnp@277369',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  driver: dbDriver,
  options: {
    encrypt: true,
    trustServerCertificate:false,
    useUTC: false,
    enableArithAbort: true,
    connectionTimeout: 15000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise;

function getConnectionInfo() {
  return {
    server: dbConfig.server,
    database: dbConfig.database,
    port: dbConfig.port || '(default)',
    instanceName: dbConfig.options.instanceName || '(none)',
    authMode: dbConfig.user && dbConfig.password ? 'SQL auth' : 'Integrated auth',
  };
}

async function connectDB() {
  try {
    if (!poolPromise) {
      poolPromise = sql.connect(dbConfig);
    }
    const pool = await poolPromise;
    const info = getConnectionInfo();
    console.log('✅ SQL Server Connected Successfully!', info);
    return pool;
  } catch (error) {
    poolPromise = null;
    console.error('❌ SQL Server Connection Error:', error.message);
    console.error('   Connection info:', getConnectionInfo());
    throw error;
  }
}

module.exports = { connectDB, sql };
