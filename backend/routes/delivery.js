const express = require('express');
const router = express.Router();
const {
  getAllDeliveries,
  getDeliveryById,
  getDeliveryByOrderId,
  getDeliveriesByStatus,
  getDeliveriesByDriver,
  createDelivery,
  updateDelivery,
  updateDeliveryStatus,
  assignDriver,
  deleteDelivery
} = require('../controllers/deliveryController');
const { auth } = require('../middleware/auth');
const { deliveryValidation } = require('../middleware/validation');

router.get('/', auth, getAllDeliveries);
router.get('/order/:order_id', auth, getDeliveryByOrderId);
router.get('/status/:status', auth, getDeliveriesByStatus);
router.get('/driver/:driver_name', auth, getDeliveriesByDriver);
router.get('/:id', auth, getDeliveryById);
router.post('/', auth, deliveryValidation, createDelivery);
router.put('/:id', auth, deliveryValidation, updateDelivery);
router.patch('/:id/status', auth, updateDeliveryStatus);
router.patch('/:id/assign-driver', auth, assignDriver);
router.delete('/:id', auth, deleteDelivery);

module.exports = router;
