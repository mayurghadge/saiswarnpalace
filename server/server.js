const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const cloudinary = require('./config/cloudinary');
const upload = require('./config/upload');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "https://saiswarnpalace.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      const isLocalDevelopmentOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
      if (!origin || isLocalDevelopmentOrigin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import controllers and routes
const productController = require('./controllers/productController');
const couponController = require('./controllers/couponController');
const adminController = require('./controllers/adminController');
const userController = require('./controllers/userController');
const cartController = require('./controllers/cartController');
const wishlistController = require('./controllers/wishlistController');
const authMiddleware = require('./middleware/auth');
const requireAdmin = authMiddleware.requireAdmin;

let dbConnected = false;

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const { connectDB } = require('./config/db');
  try {
    await connectDB();
    dbConnected = true;
  } catch (err) {
    dbConnected = false;
  }
  res.json({ status: 'OK', dbConnected, timestamp: new Date().toISOString() });
});

// Test DB connection on startup
(async () => {
  try {
    const { connectDB, isDbUnavailableError } = require('./config/db');
    await connectDB();
    dbConnected = true;
    console.log('✅ SQL Server connected');
  } catch (err) {
    dbConnected = false;
    const detail = isDbUnavailableError(err)
      ? 'Azure SQL firewall or connectivity is blocking the connection. The API will continue to run, but database-backed routes will fail until access is restored.'
      : 'Database connection failed during startup; the server will still run for non-database routes.';
    console.warn('⚠️ SQL Server not connected, but server will still run');
    console.warn(detail);
  }
})();

// Public Product Routes
app.get('/api/products', productController.getProducts);
app.get('/api/products/:id', productController.getProduct);
app.get('/api/categories', productController.getCategories);
app.get('/api/gold-rates', productController.getGoldRates);

// Public User Routes
app.post('/api/users/register', userController.register);
app.post('/api/users/login', userController.login);
app.post('/api/users/verify-otp', userController.verifyOTP);

// Coupon Routes
app.post('/api/coupons/apply', couponController.applyCoupon);

// Cart Routes (protected)
app.use('/api/cart', authMiddleware);
app.get('/api/cart', cartController.getCart);
app.post('/api/cart', cartController.addToCart);
app.put('/api/cart/:id', cartController.updateCartItem);
app.delete('/api/cart/:id', cartController.removeFromCart);
app.delete('/api/cart', cartController.clearCart);

// Wishlist Routes (protected)
app.use('/api/wishlist', authMiddleware);
app.get('/api/wishlist', wishlistController.getWishlist);
app.post('/api/wishlist', wishlistController.addToWishlist);
app.delete('/api/wishlist/:productId', wishlistController.removeFromWishlist);

// Admin Routes
app.post('/api/admin/login', adminController.adminLogin);

// Protected Admin Routes
app.use('/api/admin', authMiddleware, requireAdmin);
app.get('/api/admin/dashboard', adminController.getDashboardStats);

// Admin Categories
app.get('/api/admin/categories', adminController.getCategories);
app.post('/api/admin/categories', upload.single('category_image'), adminController.createCategory);
app.put('/api/admin/categories/:id', upload.single('category_image'), adminController.updateCategory);
app.delete('/api/admin/categories/:id', adminController.deleteCategory);

// Admin Products
app.get('/api/admin/products', adminController.getAdminProducts);
app.post('/api/admin/products', upload.single('product_image'), adminController.createProduct);
app.put('/api/admin/products/:id', upload.single('product_image'), adminController.updateProduct);
app.delete('/api/admin/products/:id', adminController.deleteProduct);

// Admin Coupons
app.get('/api/admin/coupons', adminController.getCoupons);
app.post('/api/admin/coupons', adminController.createCoupon);
app.put('/api/admin/coupons/:id', adminController.updateCoupon);
app.delete('/api/admin/coupons/:id', adminController.deleteCoupon);

// Admin Users
app.get('/api/admin/users', adminController.getUsers);
app.delete('/api/admin/users/:id', adminController.deleteUser);
app.get('/api/admin/users/:id/proofs', adminController.getUserProofs);
app.put('/api/admin/users/:id/proofs/:proofId/approve', adminController.approveProof);
app.put('/api/admin/users/:id/proofs/:proofId/reject', adminController.rejectProof);

// Admin Orders
app.get('/api/admin/orders', adminController.getOrders);
app.get('/api/admin/orders/:id', adminController.getOrder);
app.put('/api/admin/orders/:id/status', adminController.updateOrderStatus);

// Admin Contacts
app.get('/api/admin/contacts', adminController.getContacts);
app.put('/api/admin/contacts/:id/status', adminController.updateContactStatus);

// Admin Gold Rates
app.put('/api/admin/gold-rates', adminController.updateGoldRates);

//Root Route
app.get("/", (req, res) => {
  res.send("Sai Swarn Palace API is Running 🚀");
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  });
}

module.exports = app;
