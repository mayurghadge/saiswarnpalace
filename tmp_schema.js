const { connectDB } = require('./server/config/db');
(async () => {
  const pool = await connectDB();
  const result = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' ORDER BY ORDINAL_POSITION");
  console.log(JSON.stringify(result.recordset, null, 2));
})().catch(err => {
  console.error(err);
  process.exit(1);
});
