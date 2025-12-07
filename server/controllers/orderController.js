const Order = require('../models/Order');

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('products');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { products, total } = req.body;
    const order = await Order.create({
      products,
      total,
      user: req.user.id,
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
