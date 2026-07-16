const { connectDB, sql } = require('./config/db');
(async () => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('email', sql.NVarChar, 'admin@saiswarnpalace.com')
      .query('SELECT TOP 1 Id, FullName, Email, Phone, PasswordHash FROM Users WHERE Email = @email');
    console.log(JSON.stringify(result.recordset, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
