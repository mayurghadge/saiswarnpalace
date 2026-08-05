// Root test harness for the server tests.
// `npm test` runs this file, which imports all individual tests.

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.ACCESS_TOKEN_EXPIRES = '15m';
process.env.REFRESH_TOKEN_DAYS = '30';
process.env.REFRESH_TOKEN_BINDING_STRICT = 'false';
process.env.SENTRY_DSN = '';
process.env.DB_DRIVER = 'tedious';
process.env.JWT_SECRET = 'test-secret';

require('./adminAuthorization.test.js');
require('./adminController.test.js');
require('./userController.test.js');
require('./refreshLogout.endpoints.test.js');
require('./csrf.test.js');
