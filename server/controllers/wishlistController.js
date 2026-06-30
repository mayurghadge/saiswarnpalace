const { connectDB, sql } = require('../config/db');

// Get wishlist
const getWishlist = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query(`SELECT w.*, p.name, p.price, p.discount_price, p.images
              FROM Wishlist w
              JOIN Products p ON w.product_id = p.id
              WHERE w.user_id = @user_id`);

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;

    const pool = await connectDB();

    // Check if already in wishlist
    const existingResult = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('product_id', sql.Int, product_id)
      .query('SELECT * FROM Wishlist WHERE user_id = @user_id AND product_id = @product_id');

    if (existingResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('product_id', sql.Int, product_id)
      .query('INSERT INTO Wishlist (user_id, product_id) VALUES (@user_id, @product_id)');

    res.json({ message: 'Added to wishlist!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const pool = await connectDB();
    await pool.request()
      .input('productId', sql.Int, productId)
      .input('user_id', sql.Int, req.user.id)
      .query('DELETE FROM Wishlist WHERE product_id = @productId AND user_id = @user_id');

    res.json({ message: 'Removed from wishlist!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
