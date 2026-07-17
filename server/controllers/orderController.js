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
      .input("user_id", sql.Int, userId)
      .input("order_number", sql.NVarChar, orderNumber)
      .input("subtotal", sql.Decimal(18, 2), totalAmount)
      .input("discount", sql.Decimal(18, 2), 0)
      .input("tax", sql.Decimal(18, 2), 0)
      .input("shipping", sql.Decimal(18, 2), 0)
      .input("total", sql.Decimal(18, 2), totalAmount)
      .input("payment_method", sql.NVarChar, paymentMethod)
      .input("payment_status", sql.NVarChar, paymentMethod === 'Cash on Delivery' ? 'pending' : 'completed')
      .input("order_status", sql.NVarChar, 'pending')
      .query(`
        INSERT INTO Orders
        (user_id, order_number, subtotal, discount, tax, shipping, total, payment_method, payment_status, order_status, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES
        (@user_id, @order_number, @subtotal, @discount, @tax, @shipping, @total, @payment_method, @payment_status, @order_status, GETDATE(), GETDATE())
      `);

    const orderId = orderResult.recordset[0].id;

    // Insert Order Items
    if (items && items.length > 0) {
      for (const item of items) {
        const itemPrice = item.discount_price || item.price;
        await pool
          .request()
          .input("order_id", sql.Int, orderId)
          .input("product_id", sql.Int, item.id)
          .input("quantity", sql.Int, item.quantity || 1)
          .input("price", sql.Decimal(18, 2), itemPrice)
          .input("total", sql.Decimal(18, 2), (itemPrice * (item.quantity || 1)))
          .query(`
            INSERT INTO OrderItems
            (order_id, product_id, quantity, price, total)
            VALUES
            (@order_id, @product_id, @quantity, @price, @total)
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
// Get All Orders (Admin) - NOTE: Admin uses adminController.getOrders, not this one
// ===============================
exports.getOrders = async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT *
      FROM Orders
      ORDER BY created_at DESC
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
        WHERE id=@id
      `);

    const items = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT
          oi.*,
          p.Name as product_name,
          p.ImageURL as product_image
        FROM OrderItems oi
        LEFT JOIN Products p
        ON oi.product_id=p.id
        WHERE oi.order_id=@id
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
      .input("order_status", sql.NVarChar, req.body.order_status || req.body.status)
      .query(`
        UPDATE Orders
        SET order_status=@order_status, updated_at=GETDATE()
        WHERE id=@id
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT *
        FROM Orders
        WHERE user_id=@user_id
        ORDER BY created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};