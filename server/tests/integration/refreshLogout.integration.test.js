// Integration test skeleton: requires a running SQL Server from docker-compose.test.yml
// Usage (from server folder):
// 1) docker-compose -f docker-compose.test.yml up -d
// 2) set env vars (DB_SERVER, DB_USER=sa, DB_PASSWORD, DB_NAME, etc.)
// 3) npm test:integration (script not included — run node directly)

const test = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const { connectDB } = require('../../config/db');

// This test will create the RefreshTokens table (if missing) and run basic flow
test('Integration: refresh + logout against real DB (manual run)', async (t) => {
  const pool = await connectDB();
  await pool.request().query(`SELECT 1 AS ok`);

  // Ensure migration applied
  await pool.request().query(`
    IF OBJECT_ID('RefreshTokens', 'U') IS NULL
    BEGIN
      CREATE TABLE RefreshTokens (
        id INT IDENTITY(1,1) PRIMARY KEY,
        token_id NVARCHAR(100) NOT NULL,
        token_hash NVARCHAR(500) NOT NULL,
        user_id INT NOT NULL,
        expires_at DATETIME NOT NULL,
        revoked BIT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        ip_address NVARCHAR(100) NULL,
        user_agent NVARCHAR(300) NULL
      )
    END
  `);

  // This integration test requires manual invocation of the server and is intended
  // to be run in CI where the app is started with the same environment variables.
  // For local development, run the server and then execute this test file.

  t.pass('DB reachable and migration applied — continue manual test steps');
});
