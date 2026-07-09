const db = require('../config/database');

const getAllOrders = async (req, res) => {
  const sql = `
    SELECT o.*, 
           (SELECT SUM(oi.quantity * p.base_price) 
            FROM OrderItems oi 
            JOIN Products p ON oi.product_id = p.id 
            WHERE oi.order_id = o.id) as estimated_total
    FROM Orders o 
    ORDER BY o.order_time DESC
  `;
  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOrderById = async (req, res) => {
  const sql = `
    SELECT o.*, 
           (SELECT SUM(oi.quantity * p.base_price) 
            FROM OrderItems oi 
            JOIN Products p ON oi.product_id = p.id 
            WHERE oi.order_id = o.id) as estimated_total
    FROM Orders o 
    WHERE o.id = $1
  `;
  try {
    const result = await db.query(sql, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Order not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOrdersByTable = async (req, res) => {
  const sql = 'SELECT * FROM Orders WHERE table_no = $1 ORDER BY order_time DESC';
  try {
    const result = await db.query(sql, [req.params.table_no]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOrdersByStatus = async (req, res) => {
  const sql = 'SELECT * FROM Orders WHERE status = $1 ORDER BY order_time DESC';
  try {
    const result = await db.query(sql, [req.params.status]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createOrder = async (req, res) => {
  const { table_no, waiter_name, status } = req.body;
  const sql = 'INSERT INTO Orders (table_no, waiter_name, status) VALUES ($1, $2, $3) RETURNING id';
  try {
    const result = await db.query(sql, [table_no, waiter_name, status || 'pending']);
    res.status(201).json({ message: 'Order created successfully', order: { id: result.rows[0].id, table_no, waiter_name, status: status || 'pending' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateOrder = async (req, res) => {
  const { table_no, waiter_name, status } = req.body;
  const sql = 'UPDATE Orders SET table_no = $1, waiter_name = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id';
  try {
    const result = await db.query(sql, [table_no, waiter_name, status, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order updated successfully', order: { id: req.params.id, table_no, waiter_name, status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const sql = 'UPDATE Orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id';
  try {
    const result = await db.query(sql, [status, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order status updated successfully', order: { id: req.params.id, status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteOrder = async (req, res) => {
  const sql = 'DELETE FROM Orders WHERE id = $1 RETURNING id';
  try {
    const result = await db.query(sql, [req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByTable,
  getOrdersByStatus,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
};
