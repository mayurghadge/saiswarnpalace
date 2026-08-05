const test = require('node:test');
const assert = require('node:assert/strict');

const originalEnv = {
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
};

process.env.ADMIN_EMAIL = 'admin@saiswarnpalace.com';
process.env.ADMIN_PASSWORD = 'Ssp@277369';
process.env.JWT_SECRET = 'test-jwt-secret';

const loadAdminController = () => {
  delete require.cache[require.resolve('../controllers/adminController')];
  return require('../controllers/adminController');
};

let adminController = loadAdminController();

const { adminLogin, isFallbackAdminLogin } = adminController;

test.after(() => {
  process.env.ADMIN_EMAIL = originalEnv.ADMIN_EMAIL;
  process.env.ADMIN_PASSWORD = originalEnv.ADMIN_PASSWORD;
  process.env.JWT_SECRET = originalEnv.JWT_SECRET;
  delete require.cache[require.resolve('../controllers/adminController')];
});

test('default fallback admin credentials are accepted when env vars are configured', () => {
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

test('fallback admin login is disabled when env vars are not configured', async () => {
  process.env.ADMIN_EMAIL = undefined;
  process.env.ADMIN_PASSWORD = undefined;
  adminController = loadAdminController();
  const { adminLogin: adminLoginNoFallback } = adminController;

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

  await adminLoginNoFallback({ body: { email: 'admin@saiswarnpalace.com', password: 'Ssp@277369' } }, res);

  assert.equal(statusCode, 404);
  assert.equal(payload.message, 'Admin not found');
});

test('explicit admin login succeeds using Admins table credentials', async () => {
  const bcrypt = require('bcryptjs');
  const dbPath = require.resolve('../config/db');
  const originalDbExports = require.cache[dbPath].exports;

  const fakeAdmin = {
    id: 2,
    name: 'DB Admin',
    email: 'db-admin@example.com',
    password: bcrypt.hashSync('SecurePass123!', 10),
  };

  require.cache[dbPath].exports = {
    ...originalDbExports,
    connectDB: async () => ({
      request: () => ({
        input(name, type, value) {
          this.params = this.params || {};
          this.params[name] = value;
          return this;
        },
        async query() {
          return { recordset: [fakeAdmin] };
        }
      })
    })
  };

  delete require.cache[require.resolve('../controllers/adminController')];
  const { adminLogin: dbAdminLogin } = require('../controllers/adminController');

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

  await dbAdminLogin({ body: { email: 'db-admin@example.com', password: 'SecurePass123!' } }, res);

  assert.equal(statusCode, 200);
  assert.equal(payload.message, 'Login successful');
  assert.ok(payload.token);
  assert.equal(payload.admin.email, 'db-admin@example.com');

  require.cache[dbPath].exports = originalDbExports;
  delete require.cache[require.resolve('../controllers/adminController')];
  loadAdminController();
});
