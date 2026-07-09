const express = require('express');
const router = express.Router();
const {
  getAllBilling,
  getBillingById,
  getBillingByOrderId,
  createBilling,
  updateBilling,
  deleteBilling
} = require('../controllers/billingController');
const { auth } = require('../middleware/auth');
const { billingValidation } = require('../middleware/validation');

router.get('/', auth, getAllBilling);
router.get('/order/:order_id', auth, getBillingByOrderId);
router.get('/:id', auth, getBillingById);
router.post('/', auth, billingValidation, createBilling);
router.put('/:id', auth, billingValidation, updateBilling);
router.delete('/:id', auth, deleteBilling);

module.exports = router;
