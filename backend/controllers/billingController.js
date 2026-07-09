const db = require('../config/database');

const getAllBilling = async (req, res) => {
  const sql = `
    SELECT b.*, o.table_no, o.waiter_name
    FROM Billing b
    JOIN Orders o ON b.order_id = o.id
    ORDER BY b.created_at DESC
  `;
  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBillingById = async (req, res) => {
  const sql = `
    SELECT b.*, o.table_no, o.waiter_name
    FROM Billing b
    JOIN Orders o ON b.order_id = o.id
    WHERE b.id = $1
  `;
  try {
    const result = await db.query(sql, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Billing record not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBillingByOrderId = async (req, res) => {
  const sql = `
    SELECT b.*, o.table_no, o.waiter_name
    FROM Billing b
    JOIN Orders o ON b.order_id = o.id
    WHERE b.order_id = $1
  `;
  try {
    const result = await db.query(sql, [req.params.order_id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Billing record not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createBilling = async (req, res) => {
  const { order_id, subtotal, tax, discount, total, payment_method } = req.body;
  const sql = 'INSERT INTO Billing (order_id, subtotal, tax, discount, total, payment_method) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
  try {
    const result = await db.query(sql, [order_id, subtotal, tax, discount || 0, total, payment_method]);
    res.status(201).json({ message: 'Billing created successfully', billing: { id: result.rows[0].id, order_id, subtotal, tax, discount: discount || 0, total, payment_method } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Billing already exists for this order' });
    res.status(500).json({ error: err.message });
  }
};

const updateBilling = async (req, res) => {
  const { subtotal, tax, discount, total, payment_method } = req.body;
  const sql = 'UPDATE Billing SET subtotal = $1, tax = $2, discount = $3, total = $4, payment_method = $5 WHERE id = $6 RETURNING id';
  try {
    const result = await db.query(sql, [subtotal, tax, discount, total, payment_method, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Billing record not found' });
    res.json({ message: 'Billing updated successfully', billing: { id: req.params.id, subtotal, tax, discount, total, payment_method } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteBilling = async (req, res) => {
  const sql = 'DELETE FROM Billing WHERE id = $1 RETURNING id';
  try {
    const result = await db.query(sql, [req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Billing record not found' });
    res.json({ message: 'Billing deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllBilling,
  getBillingById,
  getBillingByOrderId,
  createBilling,
  updateBilling,
  deleteBilling
};
