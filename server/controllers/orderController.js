const { connectDB, sql } = require("../config/db");

// ===============================
// Create Order
// POST /api/orders
// ===============================
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      paymentMethod,
      totalAmount,
      items,
    } = req.body;

    const pool = await connectDB();
    const userId = req.user?.id || null;
    const orderNumber = `ORD-${Date.now()}`;

    // Insert Order
    const orderResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("orderNumber", sql.NVarChar, orderNumber)
      .input("totalAmount", sql.Decimal(18, 2), totalAmount)
      .input("status", sql.NVarChar, "pending")
      .query(`
        INSERT INTO Orders (UserId, OrderNumber, TotalAmount, Status, CreatedAt)
        OUTPUT INSERTED.Id AS id
        VALUES (@userId, @orderNumber, @totalAmount, @status, GETDATE())
      `);

    const orderId = orderResult.recordset[0].id;

    // Insert Order Items
    if (items && items.length > 0) {
      for (const item of items) {
        const itemPrice = item.discount_price || item.price || 0;
        await pool
          .request()
          .input("orderId", sql.Int, orderId)
          .input("productId", sql.Int, item.id)
          .input("quantity", sql.Int, item.quantity || 1)
          .input("price", sql.Decimal(18, 2), itemPrice)
          .query(`
            INSERT INTO OrderItems (OrderId, ProductId, Quantity, PriceAtTime)
            VALUES (@orderId, @productId, @quantity, @price)
          `);
      }
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId,
      orderNumber,
    });
  } catch (err) {
    console.error('Create Order Error:', err);
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT 
          Id AS id,
          OrderNumber AS order_number,
          TotalAmount AS total,
          Status AS order_status,
          CreatedAt AS created_at
        FROM Orders
        WHERE UserId = @user_id
        ORDER BY CreatedAt DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Get My Orders Error:", err);
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
        SELECT 
          Id AS id,
          OrderNumber AS order_number,
          TotalAmount AS total,
          Status AS order_status,
          CreatedAt AS created_at
        FROM Orders
        WHERE Id = @id
      `);

    if (order.recordset.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const items = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT
          oi.*,
          p.Name AS product_name,
          p.ImageURL AS product_image
        FROM OrderItems oi
        LEFT JOIN Products p
        ON oi.ProductId = p.Id
        WHERE oi.OrderId = @id
      `);

    res.json({
      order: order.recordset[0],
      items: items.recordset,
    });
  } catch (err) {
    console.error("Get Order By Id Error:", err);
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
      SELECT 
        o.Id AS id,
        o.OrderNumber AS order_number,
        o.TotalAmount AS total,
        o.Status AS order_status,
        o.CreatedAt AS created_at,
        u.FullName AS user_name,
        u.Email AS user_email,
        u.Phone AS user_phone
      FROM Orders o
      LEFT JOIN Users u ON o.UserId = u.Id
      ORDER BY o.CreatedAt DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Get Orders Error:", err);
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
      .input("status", sql.NVarChar, req.body.order_status || req.body.status)
      .query(`
        UPDATE Orders
        SET Status = @status
        WHERE Id = @id
      `);

    res.json({
      success: true,
      message: "Order status updated",
    });
  } catch (err) {
    console.error("Update Order Status Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
