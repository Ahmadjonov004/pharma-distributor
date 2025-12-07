const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Models
const { User, Product, Order } = require('./dbAdapter');

// Middleware
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your_refresh_secret';

// MongoDB Connection - with retry logic
let mongoConnected = false;
let connectionAttempts = 0;
const maxRetries = 3;

async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pharma-distributor', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
    mongoConnected = true;
  } catch (err) {
    connectionAttempts++;
    console.warn(`⚠️ MongoDB connection attempt ${connectionAttempts} failed:`, err.message);
    
    if (connectionAttempts < maxRetries) {
      console.log(`Retrying in 2 seconds...`);
      setTimeout(connectMongoDB, 2000);
    } else {
      console.warn('⚠️ Could not connect to MongoDB after retries. Using in-memory storage.');
      mongoConnected = false;
    }
  }
}

connectMongoDB();

// ===== AUTHENTICATION MIDDLEWARE =====
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ===== AUTH ROUTES =====

// REGISTER
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
    });

    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ token, refreshToken, user: { id: user._id, username: user.username } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// LOGIN
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcryptjs.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ token, refreshToken, user: { id: user._id, username: user.username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// REFRESH TOKEN
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ token });
  } catch (err) {
    res.status(403).json({ error: 'Token refresh failed' });
  }
});

// ===== PRODUCT ROUTES =====

// GET ALL PRODUCTS (for logged-in user)
app.get('/products', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user.id }).populate('owner', 'username');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// CREATE PRODUCT
app.post('/products', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, quantity } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price required' });
    }

    const product = new Product({
      name,
      description,
      price,
      quantity: quantity || 0,
      owner: req.user.id,
    });

    await product.save();
    await product.populate('owner', 'username');
    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// UPDATE PRODUCT
app.put('/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    Object.assign(product, req.body);
    await product.save();
    await product.populate('owner', 'username');
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE PRODUCT
app.delete('/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ===== ORDER ROUTES =====

// GET ALL ORDERS (for logged-in user)
app.get('/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('user', 'username')
      .populate('products');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// CREATE ORDER
app.post('/orders', authMiddleware, async (req, res) => {
  try {
    const { products, total } = req.body;
    
    if (!products || !total) {
      return res.status(400).json({ error: 'Products and total required' });
    }

    const order = new Order({
      products,
      total,
      user: req.user.id,
    });

    await order.save();
    await order.populate('user', 'username').populate('products');
    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/health`);
});
