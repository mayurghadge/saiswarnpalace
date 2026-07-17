const { connectDB, sql } = require("../config/db");
const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");

router.post("/", orderController.createOrder);          // Place Order
router.get("/", orderController.getOrders);             // Admin Orders
router.get("/my/:phone", orderController.getMyOrders);  // Customer Orders
router.get("/:id", orderController.getOrderById);       // Single Order
router.put("/:id", orderController.updateOrderStatus);  // Update Status

module.exports = router;


// ===============================
// Create Order
// POST /api/orders
// ===============================
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      address,
      paymentMethod,
      totalAmount,
      items,
    } = req.body;

    const pool = await connectDB();

    // Insert Order
    const orderResult = await pool
      .request()
      .input("customerName", sql.NVarChar, customerName)
      .input("phone", sql.NVarChar, phone)
      .input("address", sql.NVarChar, address)
      .input("paymentMethod", sql.NVarChar, paymentMethod)
      .input("totalAmount", sql.Decimal(18, 2), totalAmount)
      .query(`
        INSERT INTO Orders
        (CustomerName, Phone, Address, PaymentMethod, TotalAmount, Status, CreatedAt)
        OUTPUT INSERTED.Id
        VALUES
        (@customerName, @phone, @address, @paymentMethod,
         @totalAmount, 'Pending', GETDATE())
      `);

    const orderId = orderResult.recordset[0].Id;

    // Insert Order Items
    if (items && items.length > 0) {
      for (const item of items) {
        await pool
          .request()
          .input("orderId", sql.Int, orderId)
          .input("productId", sql.Int, item.id)
          .input("quantity", sql.Int, item.quantity)
          .input("price", sql.Decimal(18, 2), item.price)
          .query(`
            INSERT INTO OrderItems
            (OrderId, ProductId, Quantity, PriceAtTime)
            VALUES
            (@orderId, @productId, @quantity, @price)
          `);
      }
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// Get All Orders (Admin)
// ===============================
exports.getOrders = async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT *
      FROM Orders
      ORDER BY CreatedAt DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// Get Order By Id
// ===============================
exports.getOrderById = async (req, res) => {
  try {
    const pool = await connectDB();

    const order = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT *
        FROM Orders
        WHERE Id=@id
      `);

    const items = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT
          oi.*,
          p.Name,
          p.ImageURL
        FROM OrderItems oi
        LEFT JOIN Products p
        ON oi.ProductId=p.Id
        WHERE oi.OrderId=@id
      `);

    res.json({
      order: order.recordset[0],
      items: items.recordset,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// Update Order Status
// ===============================
exports.updateOrderStatus = async (req, res) => {
  try {
    const pool = await connectDB();

    await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("status", sql.NVarChar, req.body.status)
      .query(`
        UPDATE Orders
        SET Status=@status
        WHERE Id=@id
      `);

    res.json({
      success: true,
      message: "Order status updated",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// Customer My Orders
// ===============================
exports.getMyOrders = async (req, res) => {
  try {
    const phone = req.params.phone;

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("phone", sql.NVarChar, phone)
      .query(`
        SELECT *
        FROM Orders
        WHERE Phone=@phone
        ORDER BY CreatedAt DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};