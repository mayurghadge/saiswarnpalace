const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/upload');

// Public routes
router.post('/register', userController.register);
router.post('/verify-otp', userController.verifyOTP);
router.post('/login', userController.login);

// Protected routes
router.use(authMiddleware);
router.get('/profile', userController.getProfile);
router.post('/submit-verification', upload.single('verificationDocument'), userController.submitVerificationProof);
router.get('/orders', orderController.getMyOrders); // Add user's orders endpoint

module.exports = router;
