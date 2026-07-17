const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Controllers
const productController = require(
  './controllers/productController'
);

const categoryController = require(
  './controllers/categoryController'
);

const couponController = require(
  './controllers/couponController'
);

const adminController = require(
  './controllers/adminController'
);

const userController = require(
  './controllers/userController'
);

const cartController = require(
  './controllers/cartController'
);

const wishlistController = require(
  './controllers/wishlistController'
);

// Routes
const orderRoutes = require(
  './routes/orderRoutes'
);

// Middleware and upload configuration
const authMiddleware = require(
  './middleware/auth'
);

const upload = require(
  './config/upload'
);

const requireAdmin =
  authMiddleware.requireAdmin;

// --------------------------------------------------
// CORS
// --------------------------------------------------

const allowedOrigins = [
  'https://saiswarnpalace.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      const isLocalDevelopmentOrigin =
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
          origin || ''
        );

      if (
        !origin ||
        isLocalDevelopmentOrigin ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error('Not allowed by CORS')
      );
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
      'Authorization'
    ]
  })
);

// --------------------------------------------------
// BODY MIDDLEWARE
// --------------------------------------------------

app.use(express.json({ limit: '10mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

// --------------------------------------------------
// STATIC UPLOADS
// --------------------------------------------------

app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

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

// Test database connection when server starts
(async () => {
  try {
    const {
      connectDB,
      isDbUnavailableError
    } = require('./config/db');

    await connectDB();

    dbConnected = true;

    console.log('✅ SQL Server connected');
  } catch (error) {
    dbConnected = false;

    const {
      isDbUnavailableError
    } = require('./config/db');

    const detail = isDbUnavailableError(error)
      ? 'Azure SQL firewall or connectivity is blocking the connection.'
      : 'Database connection failed during server startup.';

    console.warn(
      '⚠️ SQL Server not connected, but server will still run'
    );

    console.warn(detail);
  }
})();

// --------------------------------------------------
// PUBLIC PRODUCT ROUTES
// --------------------------------------------------

app.get(
  '/api/products',
  productController.getProducts
);

app.get(
  '/api/products/:id',
  productController.getProduct
);

app.get(
  '/api/gold-rates',
  productController.getGoldRates
);

// --------------------------------------------------
// PUBLIC CATEGORY ROUTES
// Important: calculation route must come before /:id
// --------------------------------------------------

app.get(
  '/api/categories',
  categoryController.getCategories
);

app.get(
  '/api/categories/:id/calculation',
  categoryController.getCategoryCalculation
);

app.get(
  '/api/categories/:id',
  categoryController.getCategory
);

// --------------------------------------------------
// PUBLIC USER ROUTES
// --------------------------------------------------

app.post(
  '/api/users/register',
  userController.register
);

app.post(
  '/api/users/login',
  userController.login
);

app.post(
  '/api/users/verify-otp',
  userController.verifyOTP
);

// --------------------------------------------------
// COUPON ROUTES
// --------------------------------------------------

app.post(
  '/api/coupons/apply',
  couponController.applyCoupon
);

// --------------------------------------------------
// ORDER ROUTES
// --------------------------------------------------

app.use(
  '/api/orders',
  orderRoutes
);

// --------------------------------------------------
// CART ROUTES
// --------------------------------------------------

app.use(
  '/api/cart',
  authMiddleware
);

app.get(
  '/api/cart',
  cartController.getCart
);

app.post(
  '/api/cart',
  cartController.addToCart
);

app.put(
  '/api/cart/:id',
  cartController.updateCartItem
);

app.delete(
  '/api/cart/:id',
  cartController.removeFromCart
);

app.delete(
  '/api/cart',
  cartController.clearCart
);

// --------------------------------------------------
// WISHLIST ROUTES
// --------------------------------------------------

app.use(
  '/api/wishlist',
  authMiddleware
);

app.get(
  '/api/wishlist',
  wishlistController.getWishlist
);

app.post(
  '/api/wishlist',
  wishlistController.addToWishlist
);

app.delete(
  '/api/wishlist/:productId',
  wishlistController.removeFromWishlist
);

// --------------------------------------------------
// ADMIN LOGIN
// This must remain before protected admin middleware
// --------------------------------------------------

app.post(
  '/api/admin/login',
  adminController.adminLogin
);

// --------------------------------------------------
// PROTECT EVERY ADMIN ROUTE BELOW THIS LINE
// --------------------------------------------------

app.use(
  '/api/admin',
  authMiddleware,
  requireAdmin
);

// --------------------------------------------------
// ADMIN DASHBOARD
// --------------------------------------------------

app.get(
  '/api/admin/dashboard',
  adminController.getDashboardStats
);

// --------------------------------------------------
// ADMIN CATEGORIES
// Uses the new categoryController
// --------------------------------------------------

app.get(
  '/api/admin/categories',
  categoryController.getAdminCategories
);

app.post(
  '/api/admin/categories',
  upload.single('category_image'),
  categoryController.createCategory
);

app.put(
  '/api/admin/categories/:id',
  upload.single('category_image'),
  categoryController.updateCategory
);

app.delete(
  '/api/admin/categories/:id',
  categoryController.deleteCategory
);

// --------------------------------------------------
// ADMIN PRODUCTS
// --------------------------------------------------

app.get(
  '/api/admin/products',
  adminController.getAdminProducts
);

app.post(
  '/api/admin/products',
  upload.single('product_image'),
  adminController.createProduct
);

app.put(
  '/api/admin/products/:id',
  upload.single('product_image'),
  adminController.updateProduct
);

app.delete(
  '/api/admin/products/:id',
  adminController.deleteProduct
);

// --------------------------------------------------
// ADMIN COUPONS
// --------------------------------------------------

app.get(
  '/api/admin/coupons',
  adminController.getCoupons
);

app.post(
  '/api/admin/coupons',
  adminController.createCoupon
);

app.put(
  '/api/admin/coupons/:id',
  adminController.updateCoupon
);

app.delete(
  '/api/admin/coupons/:id',
  adminController.deleteCoupon
);

// --------------------------------------------------
// ADMIN USERS
// --------------------------------------------------

app.get(
  '/api/admin/users',
  adminController.getUsers
);

app.delete(
  '/api/admin/users/:id',
  adminController.deleteUser
);

app.get(
  '/api/admin/users/:id/proofs',
  adminController.getUserProofs
);

app.put(
  '/api/admin/users/:id/proofs/:proofId/approve',
  adminController.approveProof
);

app.put(
  '/api/admin/users/:id/proofs/:proofId/reject',
  adminController.rejectProof
);

// --------------------------------------------------
// ADMIN ORDERS
// --------------------------------------------------

app.get(
  '/api/admin/orders',
  adminController.getOrders
);

app.get(
  '/api/admin/orders/:id',
  adminController.getOrder
);

app.put(
  '/api/admin/orders/:id/status',
  adminController.updateOrderStatus
);

// --------------------------------------------------
// ADMIN CONTACTS
// --------------------------------------------------

app.get(
  '/api/admin/contacts',
  adminController.getContacts
);

app.put(
  '/api/admin/contacts/:id/status',
  adminController.updateContactStatus
);

// --------------------------------------------------
// ADMIN GOLD RATES
// --------------------------------------------------

app.put(
  '/api/admin/gold-rates',
  adminController.updateGoldRates
);

// --------------------------------------------------
// ROOT ROUTE
// --------------------------------------------------

app.get('/', (req, res) => {
  return res.send(
    'Sai Swarn Palace API is Running 🚀'
  );
});

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------

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

  if (
    error.message === 'Not allowed by CORS'
  ) {
    return res.status(403).json({
      message: 'This website is not allowed by CORS'
    });
  }

  return res.status(
    error.status || 500
  ).json({
    message:
      error.message || 'Internal server error'
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `🚀 Server running on http://localhost:${PORT}`
    );

    console.log(
      `📁 Uploads directory: ${path.join(
        __dirname,
        'uploads'
      )}`
    );
  });
}

module.exports = app;