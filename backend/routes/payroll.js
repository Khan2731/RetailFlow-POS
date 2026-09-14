const express = require('express');
const router = express.Router();
const {
  getPayroll,
  getPayrollById,
  generatePayroll,
  updatePayroll,
  markPaid,
  deletePayroll,
  getPayrollStats,
} = require('../controllers/payrollController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/stats', auth, getPayrollStats);
router.get('/', auth, getPayroll);
router.get('/:id', auth, getPayrollById);
router.post('/generate', auth, adminAuth, generatePayroll);
router.put('/:id', auth, adminAuth, updatePayroll);
router.patch('/:id/mark-paid', auth, adminAuth, markPaid);
router.delete('/:id', auth, adminAuth, deletePayroll);

module.exports = router;
