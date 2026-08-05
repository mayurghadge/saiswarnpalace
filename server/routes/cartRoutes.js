const express = require('express');
const router = express.Router();
const { getCart, addToCart, removeFromCart } = require('../controllers/cartController');
const authMiddleware = require('../middleware/auth');
const { requireCsrf } = require('../middleware/csrf');

// All cart routes are protected
router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, requireCsrf, addToCart);
router.delete('/:id', authMiddleware, requireCsrf, removeFromCart);

module.exports = router;
