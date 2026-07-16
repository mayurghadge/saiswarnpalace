const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAuthErrorResponse } = require('../controllers/userController');

test('buildAuthErrorResponse returns a 503 payload for Azure SQL firewall blocks', () => {
  const error = new Error("Cannot open server 'demo' requested by the login. Client with IP address '1.2.3.4' is not allowed to access the server.");
  const result = buildAuthErrorResponse(error);

  assert.equal(result.statusCode, 503);
  assert.equal(result.payload.message, 'Database connection unavailable');
  assert.match(result.payload.error, /Azure SQL/i);
});
