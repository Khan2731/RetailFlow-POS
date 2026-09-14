const express = require('express');
const router = express.Router();
const {
  getVendors, getVendorById, createVendor, updateVendor, deleteVendor,
  getVendorPayments, createVendorPayment, deleteVendorPayment,
  getVendorPurchases, createVendorPurchase,
  getVendorStats,
} = require('../controllers/vendorController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/stats', auth, getVendorStats);
router.get('/', auth, getVendors);
router.get('/:id', auth, getVendorById);
router.post('/', auth, adminAuth, createVendor);
router.put('/:id', auth, adminAuth, updateVendor);
router.delete('/:id', auth, adminAuth, deleteVendor);

// Payments
router.get('/:id/payments', auth, getVendorPayments);
router.post('/:id/payments', auth, adminAuth, createVendorPayment);
router.delete('/payments/:id', auth, adminAuth, deleteVendorPayment);

// Purchases
router.get('/:id/purchases', auth, getVendorPurchases);
router.post('/:id/purchases', auth, adminAuth, createVendorPurchase);

module.exports = router;
