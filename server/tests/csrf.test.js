const test = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');

// Load app after ensuring NODE_ENV=test so startup DB checks are skipped.
process.env.NODE_ENV = 'test';
const app = require('../server');

test('GET /api/csrf-token returns a token and sets XSRF-TOKEN cookie', async () => {
  const response = await supertest(app)
    .get('/api/csrf-token')
    .expect(200);

  assert.ok(response.body.csrfToken, 'csrfToken returned in body');
  assert.ok(response.headers['set-cookie'], 'cookie header set');
  assert.ok(
    response.headers['set-cookie'].some((cookie) => cookie.startsWith('XSRF-TOKEN=')),
    'XSRF-TOKEN cookie is set'
  );
});
