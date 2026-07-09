const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { expenseValidation } = require('../middleware/validation');

router.get('/', auth, getAllExpenses);
router.get('/:id', auth, getExpenseById);
router.post('/', auth, adminAuth, expenseValidation, createExpense);
router.put('/:id', auth, adminAuth, expenseValidation, updateExpense);
router.delete('/:id', auth, adminAuth, deleteExpense);

module.exports = router;
