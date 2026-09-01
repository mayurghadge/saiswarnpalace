const { body, validationResult } = require('express-validator');

const registerValidation = [
  body('name').isString().isLength({ min: 2 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('phone').isString().isLength({ min: 7 }).trim().escape(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty().trim()
];

const verifyOtpValidation = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 4 }).trim().escape()
];

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  runValidation
};
