const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  getOrdersByTable,
  getOrdersByStatus,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');
const { auth } = require('../middleware/auth');
const { orderValidation } = require('../middleware/validation');

router.get('/', getAllOrders);
router.get('/table/:table_no', getOrdersByTable);
router.get('/status/:status', getOrdersByStatus);
router.get('/:id', getOrderById);
router.post('/', auth, orderValidation, createOrder);
router.put('/:id', auth, orderValidation, updateOrder);
router.patch('/:id/status', auth, updateOrderStatus);
router.delete('/:id', auth, deleteOrder);

module.exports = router;
