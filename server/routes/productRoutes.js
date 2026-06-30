const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public routes
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProduct);
router.get('/categories', productController.getCategories);
router.get('/gold-rates', productController.getGoldRates);

module.exports = router;
