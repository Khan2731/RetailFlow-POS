const express = require('express');
const router = express.Router();
const { getMovements, createMovement, getInventoryStats } = require('../controllers/inventoryMovementController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/stats', auth, getInventoryStats);
router.get('/', auth, getMovements);
router.post('/', auth, adminAuth, createMovement);

module.exports = router;
