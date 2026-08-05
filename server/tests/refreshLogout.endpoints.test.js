const test = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const bcrypt = require('bcryptjs');
const path = require('path');

// Helper to inject a mock DB module before loading the app
function mockDbModule(mockExports) {
  const dbPath = require.resolve('../config/db');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: mockExports };
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

  mockDbModule({ connectDB: async () => mockPool, sql: {} });

  // Now require the server AFTER mocking db
  const app = require('../server');
  const request = supertest(app);

  const csrfRes = await request.get('/api/csrf-token').expect(200);
  const xsrfToken = csrfRes.body.csrfToken;
  const csrfCookie = csrfRes.headers['set-cookie'].find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  const csrfCookieValue = csrfCookie.split(';')[0];

  const res = await request.post('/api/users/refresh-token')
    .set('Cookie', `refreshToken=${tokenId}:${tokenValue}; ${csrfCookieValue}`)
    .set('X-CSRF-Token', xsrfToken)
    .expect(200);

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
