const test = require('node:test');
const assert = require('node:assert/strict');
const { adminLogin, isFallbackAdminLogin } = require('../controllers/adminController');

test('default fallback admin credentials are accepted', () => {
  assert.equal(isFallbackAdminLogin('admin@saiswarnpalace.com', 'Ssp@277369'), true);
});

test('fallback admin login succeeds without checking a stale database record', async () => {
  let statusCode;
  let payload;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (body) => {
      payload = body;
      return res;
    }
  };

  await adminLogin({ body: { email: 'admin@saiswarnpalace.com', password: 'Ssp@277369' } }, res);

  assert.equal(statusCode, 200);
  assert.equal(payload.message, 'Login successful');
  assert.ok(payload.token);
});
