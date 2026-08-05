const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');
const supertest = require('supertest');
const bcrypt = require('bcryptjs');

const ROOT = path.join(__dirname, '..', '..');
const COMPOSE_FILE = path.join(ROOT, 'docker-compose.test.yml');

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

function waitForPort(host, port, timeoutMs = 120000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const s = net.createConnection(port, host);
      s.on('connect', () => {
        s.end();
        resolve();
      });
      s.on('error', () => {
        s.destroy();
        if (Date.now() - start > timeoutMs) return reject(new Error('timeout waiting for port'));
        setTimeout(tryConnect, 2000);
      });
    };
    tryConnect();
  });
}

test('E2E: refresh and logout flows against real SQL Server', async (t) => {
  const useCompose = process.env.USE_DOCKER_COMPOSE === 'true';

  if (useCompose) {
    // bring up docker-compose test SQL Server for local runs
    await runCmd('docker-compose', ['-f', COMPOSE_FILE, 'up', '-d']);
  }

  try {
    // 2) wait for MSSQL port (host from env or default to localhost)
    const dbHost = process.env.DB_SERVER || '127.0.0.1';
    const dbPort = parseInt(process.env.DB_PORT || '1433', 10);
    await waitForPort(dbHost, dbPort, 120000);

    // Setup env for dedicated test DB
    const testDbName = process.env.TEST_DB_NAME || 'SaiSwarnTest';
    process.env.DB_SERVER = dbHost;
    process.env.DB_PORT = String(dbPort);
    process.env.DB_USER = process.env.DB_USER || 'sa';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'Your_strong!Passw0rd';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-secret';
    process.env.ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';

    // Create dedicated test DB if missing by connecting to master first
    const mssql = require('mssql');
    const masterConfig = {
      server: process.env.DB_SERVER,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'master',
      options: { trustServerCertificate: true }
    };
    const masterPool = await mssql.connect(masterConfig);
    await masterPool.request().query(`IF DB_ID('${testDbName}') IS NULL CREATE DATABASE [${testDbName}]`);
    await masterPool.close();

    // Now point app to the test DB
    process.env.DB_NAME = testDbName;

    // Require server after env set
    const app = require('../../server');

    // apply migration SQL
    const { connectDB } = require('../../config/db');
    const pool = await connectDB();
    const migrationSql = fs.readFileSync(path.join(ROOT, 'migrations', '001_create_refresh_tokens.sql'), 'utf8');
    await pool.request().query(migrationSql);

    // Insert a refresh token row manually
    const tokenId = 'e2e-token-id';
    const tokenValue = 'e2e-token-value-xyz';
    const tokenHash = await bcrypt.hash(tokenValue, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.request()
      .input('tokenId', 'NVARCHAR', tokenId)
      .input('tokenHash', 'NVARCHAR', tokenHash)
      .input('userId', 'INT', 555)
      .input('expiresAt', 'DATETIME', expiresAt)
      .query(`INSERT INTO RefreshTokens (token_id, token_hash, user_id, expires_at) VALUES (@tokenId, @tokenHash, @userId, @expiresAt)`);

    // Start app on ephemeral port
    const PORT = 5100;
    const server = app.listen(PORT);
    const request = supertest.agent(server);

    // Call refresh endpoint with cookie
    const res = await request.post('/api/users/refresh-token').set('Cookie', `refreshToken=${tokenId}:${tokenValue}`).expect(200);
    assert.ok(res.body.token, 'access token returned');

    // Call logout
    const res2 = await request.post('/api/users/logout').set('Cookie', `refreshToken=${tokenId}:${tokenValue}`).expect(200);
    assert.equal(res2.body.message, 'Logged out');

    server.close();

    // Drop test DB
    const masterPool2 = await mssql.connect(masterConfig);
    await masterPool2.request().query(`IF DB_ID('${testDbName}') IS NOT NULL DROP DATABASE [${testDbName}]`);
    await masterPool2.close();
  } finally {
    if (useCompose) {
      // Tear down docker-compose
      try {
        await runCmd('docker-compose', ['-f', COMPOSE_FILE, 'down', '-v']);
      } catch (e) {
        console.warn('Failed to bring down docker-compose:', e.message || e);
      }
    }
  }
});
