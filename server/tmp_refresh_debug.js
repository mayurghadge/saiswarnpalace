const bcrypt = require('bcryptjs');
const supertest = require('supertest');

function mockDbModule(mockExports) {
  const dbPath = require.resolve('./config/db');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: mockExports };
}

(async () => {
  const tokenId = 'test-token-id';
  const tokenValue = 'test-token-value-12345';
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
          console.log('QUERY:', q.trim().split('\n')[0]);
          if (q.includes('SELECT TOP 1 * FROM RefreshTokens')) {
            console.log('params', params);
            if (params['tokenId'] === tokenId) {
              return {
                recordset: [{
                  id: 1,
                  token_id: tokenId,
                  token_hash: tokenHash,
                  user_id: 42,
                  expires_at: futureDate,
                  revoked: 0
                }]
              };
            }
            return { recordset: [] };
          }
          return { recordset: [], rowsAffected: [1] };
        }
      };
    }
  };

  mockDbModule({ connectDB: async () => mockPool, sql: {} });
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  process.env.ACCESS_TOKEN_EXPIRES = '15m';
  process.env.REFRESH_TOKEN_DAYS = '30';
  process.env.REFRESH_TOKEN_BINDING_STRICT = 'false';
  process.env.SENTRY_DSN = '';
  process.env.DB_DRIVER = 'tedious';
  process.env.JWT_SECRET = 'test-secret';
  const app = require('./server');
  const request = supertest(app);

  const csrfRes = await request.get('/api/csrf-token').expect(200);
  console.log('csrfRes.body', csrfRes.body);
  console.log('csrfRes.headers', csrfRes.headers['set-cookie']);
  const csrfCookie = csrfRes.headers['set-cookie'].find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  const csrfCookieValue = csrfCookie.split(';')[0];
  console.log('csrfCookieValue', csrfCookieValue);

  const res = await request.post('/api/users/refresh-token')
    .set('Cookie', `refreshToken=${tokenId}:${tokenValue}; ${csrfCookieValue}`)
    .set('X-CSRF-Token', csrfRes.body.csrfToken);

  console.log('status', res.status);
  console.log('body', res.body);
  console.log('headers', res.headers);
})();
