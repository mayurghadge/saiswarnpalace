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
    // ✅ Set CORS headers when origin is allowed
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    return next();
  }

  return res.status(403).json({ message: "Origin not allowed" });
};
