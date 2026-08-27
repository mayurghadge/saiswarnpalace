// Vercel serverless entry point. The catch-all file keeps the Express routes
// available under /api/* in production (for example, /api/admin/login).
let app;

try {
  app = require('../server/server');
} catch (error) {
  console.error('API startup failed:', error);
  app = (req, res) => {
    res.status(503).json({
      message: 'The API is temporarily unavailable. Check the server environment configuration.'
    });
  };
}

module.exports = app;
