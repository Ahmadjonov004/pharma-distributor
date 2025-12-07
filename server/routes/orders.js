const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../controllers/authController');

router.get('/', authMiddleware, orderController.getOrders);
router.post('/', authMiddleware, orderController.createOrder);

module.exports = router;
