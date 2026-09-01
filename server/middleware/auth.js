const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production environment');
}

const getAllowedAdminEmails = () =>
  (process.env.ALLOWED_ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((email) => String(email || '').trim().toLowerCase())
    .filter(Boolean);

const isAllowedAdminEmail = (email = '') => {
  const allowedAdmins = getAllowedAdminEmails();
  if (allowedAdmins.length === 0) return true;
  return allowedAdmins.includes(String(email || '').trim().toLowerCase());
};

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;

// All /api/admin routes must receive an admin token. A valid customer token is
// sufficient for customer endpoints, but never for admin operations.
module.exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access is required' });
  }

  const adminEmail = String(req.user?.email || '').trim().toLowerCase();
  if (!isAllowedAdminEmail(adminEmail)) {
    return res.status(403).json({ message: 'This account is not authorized to access the admin panel.' });
  }

  next();
};
