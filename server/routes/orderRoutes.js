const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const orderController = require("../controllers/orderController");

router.post("/", authMiddleware, orderController.createOrder); // Require auth to create order
router.get("/my", authMiddleware, orderController.getMyOrders); // Require auth for user's orders
router.get("/:id", authMiddleware, orderController.getOrderById); // Require auth to get order by id

// Admin routes (you might want to add admin middleware here)
router.get("/", orderController.getOrders);
router.put("/:id", orderController.updateOrderStatus);

module.exports = router;