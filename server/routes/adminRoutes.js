const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const { requireCsrf } = require('../middleware/csrf');
const requireAdmin = authMiddleware.requireAdmin;
const upload = require('../config/upload');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: {
    message: 'Too many login attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public route - Admin login
router.post('/login', authLimiter, adminController.adminLogin);

// Protected routes - require valid admin token
router.use(authMiddleware, requireAdmin);
router.use(requireCsrf);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.get('/reports', adminController.getReports);
router.get('/refresh-tokens', adminController.listRefreshTokens);

// Users
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/:id/proofs', adminController.getUserProofs);
router.put('/users/:id/proofs/:proofId/approve', adminController.approveProof);
router.put('/users/:id/proofs/:proofId/reject', adminController.rejectProof);

// Emergency: clear refresh tokens (revokes all refresh tokens)
router.post('/clear-refresh-tokens', adminController.clearRefreshTokens);

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', upload.single('category_image'), adminController.createCategory);
router.put('/categories/:id', upload.single('category_image'), adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Products
router.get('/products', adminController.getAdminProducts);
router.post('/products', upload.single('product_image'), adminController.createProduct);
router.put('/products/:id', upload.single('product_image'), adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Coupons
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);
router.put('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);

// Orders
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrder);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Contacts
router.get('/contacts', adminController.getContacts);
router.put('/contacts/:id/status', adminController.updateContactStatus);

// Gold Rates
router.put('/gold-rates', adminController.updateGoldRates);

module.exports = router;
