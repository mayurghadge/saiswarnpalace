const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cloudinary = require('./config/cloudinary');
const multer = require('multer');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- IN-MEMORY DATA (DEMO MODE) ---
let users = [
  { id: 1, name: 'Demo User', email: 'demo@example.com', phone: '9876543210', is_verified: true, verification_status: 'verified' }
];
let categories = [
  { id: 1, name: 'Gold', slug: 'gold', description: 'Pure gold jewellery', image: '', created_at: new Date() },
  { id: 2, name: 'Diamond', slug: 'diamond', description: 'Sparkling diamonds', image: '', created_at: new Date() },
  { id: 3, name: 'Silver', slug: 'silver', description: 'Elegant silver', image: '', created_at: new Date() }
];
let products = [
  { id: 1, name: 'Elegant Gold Necklace', price: 85000, discount_price: 80000, category_id: 1, weight: 25, purity: '22K', images: '', stock: 10, is_featured: true },
  { id: 2, name: 'Diamond Gold Ring', price: 95000, discount_price: 89000, category_id: 2, weight: 8, purity: '18K', images: '', stock: 5, is_featured: true }
];
let verificationDocs = [];

// --- API ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Jewellery Shop API is running (DEMO MODE)' });
});

// User Registration (Demo)
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const newUser = {
      id: users.length + 1,
      name,
      email,
      phone,
      password, // Storing as-is for demo only
      is_verified: false,
      verification_status: 'not verified',
      created_at: new Date()
    };
    users.push(newUser);
    const otp = '123456';
    console.log(`Demo OTP for ${email}: ${otp}`);
    res.status(201).json({ message: 'Registered! Use OTP 123456', userId: newUser.id, otp });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify OTP (Demo)
app.post('/api/users/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (otp === '123456') {
      user.is_verified = true;
      res.status(200).json({
        message: 'Verified!',
        token: 'demo-token-' + user.id,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
      });
    } else {
      res.status(400).json({ message: 'Invalid OTP. Try 123456' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login (Demo)
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({
      message: 'Login successful',
      token: 'demo-token-' + user.id,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- ADMIN ROUTES ---
app.get('/api/admin/dashboard', (req, res) => {
  res.status(200).json({
    totalOrders: 10,
    totalProducts: products.length,
    totalUsers: users.length,
    goldRate: 6500
  });
});

// Categories
app.get('/api/categories', (req, res) => res.status(200).json({ categories }));
app.post('/api/admin/categories', upload.single('category_image'), async (req, res) => {
  try {
    let imageUrl = req.body.image || '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'jewellery/categories' });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }
    const newCat = {
      id: categories.length + 1,
      name: req.body.name,
      slug: req.body.name.toLowerCase().replace(/\s+/g, '-'),
      description: req.body.description,
      image: imageUrl,
      created_at: new Date()
    };
    categories.push(newCat);
    res.status(201).json({ message: 'Category created!', category: newCat });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});
app.put('/api/admin/categories/:id', upload.single('category_image'), async (req, res) => {
  try {
    let imageUrl = req.body.image || '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'jewellery/categories' });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }
    const catIdx = categories.findIndex(c => c.id === parseInt(req.params.id));
    if (catIdx !== -1) {
      categories[catIdx] = { ...categories[catIdx], ...req.body, image: imageUrl };
    }
    res.status(200).json({ message: 'Category updated!' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});
app.delete('/api/admin/categories/:id', (req, res) => {
  categories = categories.filter(c => c.id !== parseInt(req.params.id));
  res.status(200).json({ message: 'Category deleted!' });
});

// Products
app.get('/api/products', (req, res) => res.status(200).json({ products }));
app.post('/api/admin/products', upload.single('product_image'), async (req, res) => {
  try {
    let imageUrl = req.body.images || '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'jewellery/products' });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }
    const newProduct = {
      id: products.length + 1,
      ...req.body,
      images: imageUrl,
      created_at: new Date()
    };
    products.push(newProduct);
    res.status(201).json({ message: 'Product created!', product: newProduct });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});
app.put('/api/admin/products/:id', upload.single('product_image'), async (req, res) => {
  try {
    let imageUrl = req.body.images || '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'jewellery/products' });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }
    const prodIdx = products.findIndex(p => p.id === parseInt(req.params.id));
    if (prodIdx !== -1) {
      products[prodIdx] = { ...products[prodIdx], ...req.body, images: imageUrl };
    }
    res.status(200).json({ message: 'Product updated!' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});
app.delete('/api/admin/products/:id', (req, res) => {
  products = products.filter(p => p.id !== parseInt(req.params.id));
  res.status(200).json({ message: 'Product deleted!' });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin' && password === 'Ssp@277369') {
    res.status(200).json({ message: 'Login successful', token: 'admin-token', admin: { name: 'Admin' } });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Get gold rates
app.get('/api/gold-rates', (req, res) => res.status(200).json({
  goldRates: { gold_22k: 6500, gold_24k: 7100, gold_18k: 5400, silver_rate: 75, gst_rate: 3, wastage_rate: 12 }
}));
app.put('/api/admin/gold-rates', (req, res) => res.status(200).json({ message: 'Rates updated!' }));

app.listen(PORT, () => console.log(`🚀 DEMO Server running on http://localhost:${PORT}`));
