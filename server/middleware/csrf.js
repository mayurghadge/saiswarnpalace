const crypto = require('crypto');

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const header = req.get('x-csrf-token') || req.get('x-xsrf-token');
  const cookie = req.cookies && req.cookies['XSRF-TOKEN'];

  if (header && cookie && header === cookie) {
    return next();
  }

  return res.status(403).json({ message: 'Invalid CSRF token' });
}

module.exports = {
  generateCsrfToken,
  requireCsrf
};
