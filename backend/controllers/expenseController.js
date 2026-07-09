const db = require('../config/database');

const getAllExpenses = async (req, res) => {
  const sql = 'SELECT * FROM Expenses ORDER BY expense_date DESC';
  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getExpenseById = async (req, res) => {
  const sql = 'SELECT * FROM Expenses WHERE id = $1';
  try {
    const result = await db.query(sql, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Expense not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createExpense = async (req, res) => {
  const { category, description, amount, expense_date } = req.body;
  const sql = 'INSERT INTO Expenses (category, description, amount, expense_date) VALUES ($1, $2, $3, $4) RETURNING id';
  try {
    const result = await db.query(sql, [category, description || '', amount, expense_date || new Date().toISOString()]);
    res.status(201).json({ message: 'Expense recorded successfully', expense: { id: result.rows[0].id, category, description: description || '', amount, expense_date: expense_date || new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateExpense = async (req, res) => {
  const { category, description, amount, expense_date } = req.body;
  const sql = 'UPDATE Expenses SET category = $1, description = $2, amount = $3, expense_date = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id';
  try {
    const result = await db.query(sql, [category, description || '', amount, expense_date || new Date().toISOString(), req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense updated successfully', expense: { id: req.params.id, category, description: description || '', amount, expense_date: expense_date || new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteExpense = async (req, res) => {
  const sql = 'DELETE FROM Expenses WHERE id = $1 RETURNING id';
  try {
    const result = await db.query(sql, [req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
