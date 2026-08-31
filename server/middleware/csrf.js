const crypto = require('crypto');

const CSRF_TOKEN_TTL_MS = 60 * 60 * 1000;

function getCsrfSecret() {
  return process.env.CSRF_SECRET || process.env.JWT_SECRET;
}

function sign(payload) {
  return crypto
    .createHmac('sha256', getCsrfSecret())
    .update(payload)
    .digest('hex');
}

function generateCsrfToken() {
  const payload = [
    Date.now().toString(),
    crypto.randomBytes(24).toString('hex')
  ].join('.');

  return `${payload}.${sign(payload)}`;
}

function isValidCsrfToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    return false;
  }

  const [timestamp, nonce, signature] = parts;
  const issuedAt = Number(timestamp);

  if (
    !Number.isFinite(issuedAt) ||
    Date.now() - issuedAt > CSRF_TOKEN_TTL_MS ||
    issuedAt > Date.now() + 60 * 1000
  ) {
    return false;
  }

  const expectedSignature = sign(`${timestamp}.${nonce}`);
  const receivedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token =
    req.get('x-csrf-token') || req.get('x-xsrf-token');

  if (isValidCsrfToken(token)) {
    return next();
  }

  return res.status(403).json({
    message: 'Invalid CSRF token'
  });
}

module.exports = {
  generateCsrfToken,
  requireCsrf
};
