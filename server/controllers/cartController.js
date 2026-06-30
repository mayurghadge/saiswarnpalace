const { connectDB, sql } = require('../config/db');

// Get cart
const getCart = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query(`SELECT c.*, p.name, p.price, p.discount_price, p.images
              FROM Cart c
              JOIN Products p ON c.product_id = p.id
              WHERE c.user_id = @user_id`);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    const pool = await connectDB();

    // Check if product is already in cart
    const existingResult = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('product_id', sql.Int, product_id)
      .query('SELECT * FROM Cart WHERE user_id = @user_id AND product_id = @product_id');

    if (existingResult.recordset.length > 0) {
      // Update quantity
      const newQuantity = existingResult.recordset[0].quantity + (quantity || 1);
      await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .input('product_id', sql.Int, product_id)
        .input('quantity', sql.Int, newQuantity)
        .query('UPDATE Cart SET quantity = @quantity WHERE user_id = @user_id AND product_id = @product_id');
    } else {
      // Insert new item
      await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .input('product_id', sql.Int, product_id)
        .input('quantity', sql.Int, quantity || 1)
        .query('INSERT INTO Cart (user_id, product_id, quantity) VALUES (@user_id, @product_id, @quantity)');
    }

    res.json({ message: 'Item added to cart!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update cart item
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .input('quantity', sql.Int, quantity || 1)
      .input('user_id', sql.Int, req.user.id)
      .query('UPDATE Cart SET quantity = @quantity WHERE id = @id AND user_id = @user_id');

    res.json({ message: 'Cart item updated!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .input('user_id', sql.Int, req.user.id)
      .query('DELETE FROM Cart WHERE id = @id AND user_id = @user_id');

    res.json({ message: 'Item removed from cart!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const pool = await connectDB();
    await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query('DELETE FROM Cart WHERE user_id = @user_id');

    res.json({ message: 'Cart cleared!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
