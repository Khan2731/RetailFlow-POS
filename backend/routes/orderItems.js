const express = require('express');
const router = express.Router();
const {
  getOrderItemsByOrderId,
  getOrderItemById,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem
} = require('../controllers/orderItemController');
const { auth } = require('../middleware/auth');
const { orderItemValidation } = require('../middleware/validation');

router.get('/order/:order_id', auth, getOrderItemsByOrderId);
router.get('/:id', auth, getOrderItemById);
router.post('/', auth, orderItemValidation, createOrderItem);
router.put('/:id', auth, orderItemValidation, updateOrderItem);
router.delete('/:id', auth, deleteOrderItem);

module.exports = router;
