const express = require('express');
const router = express.Router();
const {
  getSalaryAdvances,
  getPendingRecoveries,
  getSalaryAdvanceById,
  createSalaryAdvance,
  updateSalaryAdvance,
  recoverAdvance,
  deleteSalaryAdvance,
  getAdvanceStats,
} = require('../controllers/salaryAdvanceController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/stats', auth, getAdvanceStats);
router.get('/pending', auth, getPendingRecoveries);
router.get('/', auth, getSalaryAdvances);
router.get('/:id', auth, getSalaryAdvanceById);
router.post('/', auth, adminAuth, createSalaryAdvance);
router.put('/:id', auth, adminAuth, updateSalaryAdvance);
router.post('/:id/recover', auth, adminAuth, recoverAdvance);
router.delete('/:id', auth, adminAuth, deleteSalaryAdvance);

module.exports = router;
