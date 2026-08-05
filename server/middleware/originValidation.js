const allowedOrigins = [
  'https://saiswarnpalace.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const allowLocalDevelopment = (origin) => {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
};

module.exports = (req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || allowLocalDevelopment(origin) || allowedOrigins.includes(origin)) {
    return next();
  }

  return res.status(403).json({ message: 'Origin not allowed' });
};
