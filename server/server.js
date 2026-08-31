const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const Sentry = require('@sentry/node');
const path = require('path');
const cookieParser = require('cookie-parser');
const { generateCsrfToken, requireCsrf } = require('./middleware/csrf');

dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Basic environment sanity checks
if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET === 'your-secret-key'
) {
  const msg =
    'WARNING: JWT_SECRET is not set or uses an insecure default. ' +
    'Set a strong JWT_SECRET in your environment (do not commit it).';

  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
}

// --------------------------------------------------
// SECURITY
// --------------------------------------------------

app.use(helmet());

// --------------------------------------------------
// CORS
// IMPORTANT: This must be before csrf-token and all routes.
// --------------------------------------------------

const allowedOrigins = [
  'https://saiswarnpalace.vercel.app',
  process.env.FRONTEND_URL
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ''));

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = (origin || '').replace(/\/$/, '');

    const isLocalDevelopmentOrigin =
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        normalizedOrigin
      );

    if (
      !origin ||
      isLocalDevelopmentOrigin ||
      allowedOrigins.includes(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-XSRF-Token'
  ]
};

app.use(cors(corsOptions));

// Enforce HSTS in production
if (process.env.NODE_ENV === 'production') {
  app.use(
    helmet.hsts({
      maxAge: 60 * 60 * 24 * 365,
      includeSubDomains: true,
      preload: true
    })
  );

  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return next();
    }

    return res.redirect(`https://${req.headers.host}${req.url}`);
  });
}

// --------------------------------------------------
// GLOBAL MIDDLEWARE
// --------------------------------------------------

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);

app.use(cookieParser());

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development'
  });

  app.use(Sentry.Handlers.requestHandler());
}

morgan.token('remote-user', () => '-');
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
);

app.use(express.json({ limit: '10mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

// --------------------------------------------------
// CSRF TOKEN
// --------------------------------------------------

app.get('/api/csrf-token', (req, res) => {
  const token = generateCsrfToken();

  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 1000 * 60 * 60
  });

  return res.json({ csrfToken: token });
});

// --------------------------------------------------
// STATIC UPLOADS
// --------------------------------------------------

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// --------------------------------------------------
// LIMITERS
// --------------------------------------------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: {
    message:
      'Too many login attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// --------------------------------------------------
// CONTROLLERS
// --------------------------------------------------

const productController = require('./controllers/productController');

const categoryController = require(
  './controllers/categoryController'
);

const couponController = require('./controllers/couponController');

const userController = require('./controllers/userController');

const {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  runValidation
} = require('./middleware/validators');

const cartController = require('./controllers/cartController');

const wishlistController = require(
  './controllers/wishlistController'
);

const orderRoutes = require('./routes/orderRoutes');

const authMiddleware = require('./middleware/auth');

const originValidation = require(
  './middleware/originValidation'
);

const adminRoutes = require('./routes/adminRoutes');

// --------------------------------------------------
// DATABASE STATUS
// --------------------------------------------------

let dbConnected = false;

app.get('/api/health', async (req, res) => {
  const { connectDB } = require('./config/db');

  try {
    await connectDB();
    dbConnected = true;
  } catch (error) {
    dbConnected = false;
  }

  return res.json({
    status: 'OK',
    dbConnected,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      const { connectDB } = require('./config/db');

      await connectDB();

      dbConnected = true;

      console.log('✅ SQL Server connected');

      try {
        const {
          scheduleRefreshTokenCleanup
        } = require('./utils/tokenCleanup');

        scheduleRefreshTokenCleanup(connectDB);

        console.log('🧹 Scheduled refresh token cleanup');
      } catch (e) {
        console.warn(
          'Failed to schedule refresh token cleanup',
          e.message || e
        );
      }
    } catch (error) {
      dbConnected = false;

      const { isDbUnavailableError } = require('./config/db');

      const detail = isDbUnavailableError(error)
        ? 'Azure SQL firewall or connectivity is blocking the connection.'
        : 'Database connection failed during server startup.';

      console.warn(
        '⚠️ SQL Server not connected, but server will still run'
      );

      console.warn(detail);
    }
  })();
}

// --------------------------------------------------
// PUBLIC PRODUCT ROUTES
// --------------------------------------------------

app.get('/api/products', productController.getProducts);

app.get('/api/products/:id', productController.getProduct);

app.get('/api/gold-rates', productController.getGoldRates);

// --------------------------------------------------
// PUBLIC CATEGORY ROUTES
// --------------------------------------------------

app.get('/api/categories', categoryController.getCategories);

app.get(
  '/api/categories/:id/calculation',
  categoryController.getCategoryCalculation
);

app.post(
  '/api/categories/:id/calculate',
  categoryController.calculateCategoryPrice
);

app.get('/api/categories/:id', categoryController.getCategory);

// --------------------------------------------------
// PUBLIC USER ROUTES
// --------------------------------------------------

app.post(
  '/api/users/register',
  registerValidation,
  runValidation,
  userController.register
);

app.post(
  '/api/users/login',
  authLimiter,
  loginValidation,
  runValidation,
  userController.login
);

app.post(
  '/api/users/verify-otp',
  verifyOtpValidation,
  runValidation,
  userController.verifyOTP
);

app.post(
  '/api/users/refresh-token',
  originValidation,
  requireCsrf,
  userController.refreshToken
);

app.post(
  '/api/users/logout',
  originValidation,
  requireCsrf,
  userController.logout
);

// --------------------------------------------------
// COUPON ROUTES
// --------------------------------------------------

app.post('/api/coupons/apply', couponController.applyCoupon);

// --------------------------------------------------
// ORDER ROUTES
// --------------------------------------------------

app.use('/api/orders', orderRoutes);

// --------------------------------------------------
// CART ROUTES
// --------------------------------------------------

app.use('/api/cart', authMiddleware);

app.get('/api/cart', cartController.getCart);

app.post('/api/cart', requireCsrf, cartController.addToCart);

app.put(
  '/api/cart/:id',
  requireCsrf,
  cartController.updateCartItem
);

app.delete(
  '/api/cart/:id',
  requireCsrf,
  cartController.removeFromCart
);

app.delete('/api/cart', requireCsrf, cartController.clearCart);

// --------------------------------------------------
// WISHLIST ROUTES
// --------------------------------------------------

app.use('/api/wishlist', authMiddleware);

app.get('/api/wishlist', wishlistController.getWishlist);

app.post(
  '/api/wishlist',
  requireCsrf,
  wishlistController.addToWishlist
);

app.delete(
  '/api/wishlist/:productId',
  requireCsrf,
  wishlistController.removeFromWishlist
);

// --------------------------------------------------
// ADMIN ROUTES
// --------------------------------------------------

app.use('/api/admin', adminRoutes);

// --------------------------------------------------
// ROOT ROUTE
// --------------------------------------------------

app.get('/', (req, res) => {
  return res.send('Sai Swarn Palace API is Running 🚀');
});

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use((error, req, res, next) => {
  console.error('API Error:', error);

  if (
    error.name === 'MulterError' ||
    error.message?.includes('file')
  ) {
    return res.status(400).json({
      message: 'Image upload failed',
      error: error.message
    });
  }

  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      message: 'This website is not allowed by CORS'
    });
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Internal server error'
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);

    console.log(
      `📁 Uploads directory: ${path.join(__dirname, 'uploads')}`
    );
  });
}

module.exports = app;