const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const requireAdmin = authMiddleware.requireAdmin;
const upload = require('../config/upload');

// Public route - Admin login
router.post('/login', adminController.adminLogin);

// Protected routes - require valid admin token
router.use(authMiddleware, requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/:id/proofs', adminController.getUserProofs);
router.put('/users/:id/proofs/:proofId/approve', adminController.approveProof);
router.put('/users/:id/proofs/:proofId/reject', adminController.rejectProof);

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
