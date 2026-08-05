const test = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const bcrypt = require('bcryptjs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.ACCESS_TOKEN_EXPIRES = '15m';
process.env.REFRESH_TOKEN_DAYS = '30';
process.env.REFRESH_TOKEN_BINDING_STRICT = 'false';
process.env.SENTRY_DSN = '';
process.env.DB_DRIVER = 'tedious';
process.env.JWT_SECRET = 'test-secret';

const csrf = require('../middleware/csrf');

// Helper to inject a mock DB module before loading the app
function mockDbModule(mockExports) {
  const dbPath = require.resolve('../config/db');
  delete require.cache[dbPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: mockExports
  };
}

function clearAppAndControllerCache() {
  const serverPath = require.resolve('../server');
  const userControllerPath = require.resolve('../controllers/userController');

  delete require.cache[serverPath];
  delete require.cache[userControllerPath];
}

test('Refresh token rotates and returns new access token', async (t) => {
  // generate tokenId and tokenValue
  const tokenId = 'test-token-id';
  const tokenValue = 'test-token-value-12345';
  const tokenHash = await bcrypt.hash(tokenValue, 10);

  const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();

  // Mock pool that returns a matching refresh token row
  const mockPool = {
    request() {
      const params = {};
      return {
        input(name, type, value) {
          params[name] = value;
          return this;
        },
        async query(q) {
          if (q.includes('SELECT TOP 1 * FROM RefreshTokens')) {
            if (params['tokenId'] === tokenId) {
              return { recordset: [{ id: 1, token_id: tokenId, token_hash: tokenHash, user_id: 42, expires_at: futureDate, revoked: 0 }] };
            }
            return { recordset: [] };
          }
          // Accept updates/inserts
          return { recordset: [], rowsAffected: [1] };
        }
      };
    }
  };

  clearAppAndControllerCache();
  mockDbModule({ connectDB: async () => mockPool, sql: {} });
  const dbPath = require.resolve('../config/db');
  console.log('DEBUG refresh test config/db exports before server:', require.cache[dbPath]?.exports);

  // Now require the server AFTER mocking db
  const app = require('../server');
  console.log('DEBUG refresh test config/db exports after server:', require.cache[dbPath]?.exports);
  const request = supertest(app);

  const csrfRes = await request.get('/api/csrf-token').expect(200);
  const xsrfToken = csrfRes.body.csrfToken;
  const csrfCookie = csrfRes.headers['set-cookie'].find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  const csrfCookieValue = csrfCookie.split(';')[0];

  let res;
  try {
    res = await request.post('/api/users/refresh-token')
      .set('Cookie', `refreshToken=${tokenId}:${tokenValue}; ${csrfCookieValue}`)
      .set('X-CSRF-Token', xsrfToken)
      .expect(200);
  } catch (error) {
    console.error('DEBUG refresh request error:', error.message || error);
    if (error.response) {
      console.error('DEBUG refresh request response status:', error.response.status);
      console.error('DEBUG refresh request response headers:', error.response.headers);
      console.error('DEBUG refresh request response body:', error.response.body);
    }
    throw error;
  }

  assert.ok(res.body.token, 'access token returned');
  const setCookie = res.headers['set-cookie'];
  assert.ok(setCookie && setCookie.some(c => c.startsWith('refreshToken=')), 'refresh cookie set');
});

test('Logout revokes token and clears cookie', async (t) => {
  const tokenId = 'logout-token-id';
  const tokenValue = 'logout-token-value';
  const tokenHash = await bcrypt.hash(tokenValue, 10);
  const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();

  const mockPool = {
    request() {
      const params = {};
      return {
        input(name, type, value) {
          params[name] = value;
          return this;
        },
        async query(q) {
          // Return a row for select
          if (q.includes('SELECT TOP 1 * FROM RefreshTokens')) {
            if (params['tokenId'] === tokenId) {
              return { recordset: [{ id: 2, token_id: tokenId, token_hash: tokenHash, user_id: 99, expires_at: futureDate, revoked: 0 }] };
            }
            return { recordset: [] };
          }
          return { recordset: [], rowsAffected: [1] };
        }
      };
    }
  };

  mockDbModule({ connectDB: async () => mockPool, sql: {} });
  delete require.cache[require.resolve('../server')];
  const app = require('../server');
  const request = supertest(app);

  const csrfRes = await request.get('/api/csrf-token').expect(200);
  const xsrfToken = csrfRes.body.csrfToken;
  const csrfCookie = csrfRes.headers['set-cookie'].find((cookie) => cookie.startsWith('XSRF-TOKEN='));

  const res = await request.post('/api/users/logout')
    .set('Cookie', `refreshToken=${tokenId}:${tokenValue}; ${csrfCookie}`)
    .set('X-CSRF-Token', xsrfToken)
    .expect(200);

  assert.equal(res.body.message, 'Logged out');
  const setCookie = res.headers['set-cookie'];
  assert.ok(setCookie && setCookie.some(c => c.startsWith('refreshToken=') && c.includes('Expires=Thu, 01 Jan 1970')), 'cookie cleared');
});
