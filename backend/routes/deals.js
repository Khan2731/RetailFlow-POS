const express = require('express');
const router = express.Router();
const {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal
} = require('../controllers/dealController');
const { auth } = require('../middleware/auth');
const { dealValidation } = require('../middleware/validation');

router.get('/', auth, getAllDeals);
router.get('/:id', auth, getDealById);
router.post('/', auth, dealValidation, createDeal);
router.put('/:id', auth, dealValidation, updateDeal);
router.delete('/:id', auth, deleteDeal);

module.exports = router;
