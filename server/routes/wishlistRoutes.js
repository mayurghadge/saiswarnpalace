const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/auth');
const { requireCsrf } = require('../middleware/csrf');

// All wishlist routes are protected
router.get('/', authMiddleware, getWishlist);
router.post('/', authMiddleware, requireCsrf, addToWishlist);
router.delete('/:id', authMiddleware, requireCsrf, removeFromWishlist);

module.exports = router;
