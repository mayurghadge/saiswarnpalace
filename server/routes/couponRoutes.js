const express = require('express');
const { applyCoupon } = require('../controllers/couponController');
const router = express.Router();

router.post('/apply', applyCoupon);

module.exports = router;
