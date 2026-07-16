const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const secret = process.env.JWT_SECRET || 'your-secret-key';

const runAuth = (token) => {
  const req = { header: () => `Bearer ${token}` };
  const result = { req };
  const res = {
    status: (code) => {
      result.statusCode = code;
      return res;
    },
    json: (body) => {
      result.payload = body;
      return res;
    }
  };
  let nextCalled = false;
  auth(req, res, () => { nextCalled = true; });
  result.res = res;
  result.nextCalled = nextCalled;
  return result;
};

test('admin tokens are granted access to protected admin routes', () => {
  const token = jwt.sign({ id: 1, role: 'admin' }, secret);
  const result = runAuth(token);
  let nextCalled = false;

  auth.requireAdmin(result.req, result.res, () => { nextCalled = true; });

  assert.equal(result.nextCalled, true);
  assert.equal(nextCalled, true);
});

test('customer tokens cannot access protected admin routes', () => {
  const token = jwt.sign({ id: 2, role: 'user' }, secret);
  const result = runAuth(token);

  auth.requireAdmin(result.req, result.res, () => {});

  assert.equal(result.statusCode, 403);
  assert.equal(result.payload.message, 'Admin access is required');
});
