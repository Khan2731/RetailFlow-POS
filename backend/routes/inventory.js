const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getInventoryById,
  getLowStockItems,
  createInventory,
  updateInventory,
  updateInventoryQuantity,
  adjustInventoryQuantity,
  deleteInventory
} = require('../controllers/inventoryController');
const { auth, adminAuth } = require('../middleware/auth');
const { inventoryValidation } = require('../middleware/validation');

router.get('/', auth, getAllInventory);
router.get('/low-stock', auth, getLowStockItems);
router.get('/:id', auth, getInventoryById);
router.post('/', auth, adminAuth, inventoryValidation, createInventory);
router.put('/:id', auth, adminAuth, inventoryValidation, updateInventory);
router.patch('/:id/quantity', auth, adminAuth, updateInventoryQuantity);
router.patch('/:id/adjust', auth, adminAuth, adjustInventoryQuantity);
router.delete('/:id', auth, adminAuth, deleteInventory);

module.exports = router;
