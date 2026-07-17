const { connectDB, sql } = require("../config/db");

// ===============================
// Ensure Orders and OrderItems tables exist with all columns
// ===============================
async function ensureOrdersTable(pool) {
  // Add OrderNumber column first if missing!
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'OrderNumber')
    BEGIN
      ALTER TABLE Orders ADD OrderNumber NVARCHAR(50) NULL
    END
  `);
  
  // Create Orders table if it doesn't exist
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Orders')
    BEGIN
      CREATE TABLE Orders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NULL,
        OrderNumber NVARCHAR(50) NOT NULL,
        TotalAmount DECIMAL(18,2) NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CustomerName NVARCHAR(100) NULL,
        CustomerPhone NVARCHAR(20) NULL,
        CustomerEmail NVARCHAR(100) NULL,
        ShippingAddress NVARCHAR(MAX) NULL,
        ShippingCity NVARCHAR(100) NULL,
        ShippingState NVARCHAR(100) NULL,
        ShippingPincode NVARCHAR(20) NULL,
        PaymentMethod NVARCHAR(50) NULL
      )
    END
  `);
  
  // Create OrderItems table if it doesn't exist
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'OrderItems')
    BEGIN
      CREATE TABLE OrderItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL FOREIGN KEY REFERENCES Orders(Id),
        ProductId INT NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        PriceAtTime DECIMAL(18,2) NOT NULL
      )
    END
  `);
  
  // Add missing columns to Orders table if needed
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'CustomerName')
    BEGIN
      ALTER TABLE Orders ADD CustomerName NVARCHAR(100) NULL
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'CustomerPhone')
    BEGIN
      ALTER TABLE Orders ADD CustomerPhone NVARCHAR(20) NULL
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'CustomerEmail')
    BEGIN
      ALTER TABLE Orders ADD CustomerEmail NVARCHAR(100) NULL
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'ShippingAddress')
    BEGIN
      ALTER TABLE Orders ADD ShippingAddress NVARCHAR(MAX) NULL
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'ShippingCity')
    BEGIN
      ALTER TABLE Orders ADD ShippingCity NVARCHAR(100) NULL
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'ShippingState')
    BEGIN
      ALTER TABLE Orders ADD ShippingState NVARCHAR(100) NULL
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'ShippingPincode')
    BEGIN
      ALTER TABLE Orders ADD ShippingPincode NVARCHAR(20) NULL
    END
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'PaymentMethod')
    BEGIN
      ALTER TABLE Orders ADD PaymentMethod NVARCHAR(50) NULL
    END
  `);
}

// ===============================
// Create Order
// POST /api/orders
// ===============================
exports.createOrder = async (req, res) => {
  try {
    console.log('📦 Order request body:', JSON.stringify(req.body, null, 2));

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
    await ensureOrdersTable(pool);
    const userId = req.user?.id || null;
    const orderNumber = `ORD-${Date.now()}`;

    console.log('📝 Creating order with order number:', orderNumber);

    // Insert Order
    const orderResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("orderNumber", sql.NVarChar, orderNumber)
      .input("totalAmount", sql.Decimal(18, 2), totalAmount)
      .input("status", sql.NVarChar, "pending")
      .input("customerName", sql.NVarChar, customerName)
      .input("customerPhone", sql.NVarChar, phone)
      .input("customerEmail", sql.NVarChar, email)
      .input("shippingAddress", sql.NVarChar, address)
      .input("shippingCity", sql.NVarChar, city)
      .input("shippingState", sql.NVarChar, state)
      .input("shippingPincode", sql.NVarChar, pincode)
      .input("paymentMethod", sql.NVarChar, paymentMethod)
      .query(`
        INSERT INTO Orders (UserId, OrderNumber, TotalAmount, Status, CreatedAt, CustomerName, CustomerPhone, CustomerEmail, ShippingAddress, ShippingCity, ShippingState, ShippingPincode, PaymentMethod)
        OUTPUT INSERTED.Id AS id
        VALUES (@userId, @orderNumber, @totalAmount, @status, GETDATE(), @customerName, @customerPhone, @customerEmail, @shippingAddress, @shippingCity, @shippingState, @shippingPincode, @paymentMethod)
      `);

    const orderId = orderResult.recordset[0].id;
    console.log('✅ Order created with ID:', orderId);

    // Insert Order Items
    if (items && items.length > 0) {
      console.log('🛒 Inserting', items.length, 'order items');
      for (const item of items) {
        const itemPrice = item.discount_price || item.price || 0;
        console.log('📦 Adding item:', JSON.stringify(item, null, 2));
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
    console.error('❌ Create Order Error:', err);
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
    await ensureOrdersTable(pool);

    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT 
          Id AS id,
          OrderNumber AS order_number,
          TotalAmount AS total,
          Status AS order_status,
          CreatedAt AS created_at,
          CustomerName,
          CustomerPhone,
          CustomerEmail,
          ShippingAddress,
          ShippingCity,
          ShippingState,
          ShippingPincode,
          PaymentMethod
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
    await ensureOrdersTable(pool);

    const order = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT 
          Id AS id,
          OrderNumber AS order_number,
          TotalAmount AS total,
          Status AS order_status,
          CreatedAt AS created_at,
          CustomerName,
          CustomerPhone,
          CustomerEmail,
          ShippingAddress,
          ShippingCity,
          ShippingState,
          ShippingPincode,
          PaymentMethod
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
    await ensureOrdersTable(pool);

    const result = await pool.request().query(`
      SELECT 
        o.Id AS id,
        o.OrderNumber AS order_number,
        o.TotalAmount AS total,
        o.Status AS order_status,
        o.CreatedAt AS created_at,
        o.CustomerName,
        o.CustomerPhone,
        o.CustomerEmail,
        o.ShippingAddress,
        o.ShippingCity,
        o.ShippingState,
        o.ShippingPincode,
        o.PaymentMethod,
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
