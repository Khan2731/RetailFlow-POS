const db = require('../config/database');

const getBusinessDate = (date = new Date()) => {
  const localDate = new Date(date);
  const hour = localDate.getHours();
  const minute = localDate.getMinutes();
  const totalMinutes = hour * 60 + minute;
  if (totalMinutes >= 11 * 60) {
    return localDate.toISOString().slice(0, 10);
  }
  const previousDay = new Date(localDate);
  previousDay.setDate(previousDay.getDate() - 1);
  return previousDay.toISOString().slice(0, 10);
};

const getActiveShiftForUser = async (userId) => {
  const result = await db.query(
    `SELECT * FROM Shifts WHERE cashier_id = $1 AND status = 'open' ORDER BY start_time DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

const getAllOrders = async (req, res) => {
  const sql = `
    SELECT o.*, 
           COALESCE(
             (
               SELECT COALESCE(SUM(COALESCE(NULLIF(oi.unit_price, 0), 0) * oi.quantity), 0)
               FROM OrderItems oi
               WHERE oi.order_id = o.id
             ),
             (SELECT COALESCE(b.total, 0) FROM Billing b WHERE b.order_id = o.id)
           ) as estimated_total,
           s.name as cashier_name,
           c.name as cancelled_by_name
    FROM Orders o
    LEFT JOIN Staff s ON o.shift_id = s.id
    LEFT JOIN Staff c ON o.cancelled_by = c.id
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
           COALESCE(
             (
               SELECT COALESCE(SUM(COALESCE(NULLIF(oi.unit_price, 0), 0) * oi.quantity), 0)
               FROM OrderItems oi
               WHERE oi.order_id = o.id
             ),
             (SELECT COALESCE(b.total, 0) FROM Billing b WHERE b.order_id = o.id)
           ) as estimated_total,
           s.name as cashier_name,
           c.name as cancelled_by_name
    FROM Orders o
    LEFT JOIN Staff s ON o.shift_id = s.id
    LEFT JOIN Staff c ON o.cancelled_by = c.id
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
  const sql = `SELECT o.*, s.name as cashier_name, c.name as cancelled_by_name
    FROM Orders o
    LEFT JOIN Staff s ON o.shift_id = s.id
    LEFT JOIN Staff c ON o.cancelled_by = c.id
    WHERE o.table_no = $1 ORDER BY o.order_time DESC`;
  try {
    const result = await db.query(sql, [req.params.table_no]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOrdersByStatus = async (req, res) => {
  const sql = `SELECT o.*, s.name as cashier_name, c.name as cancelled_by_name
    FROM Orders o
    LEFT JOIN Staff s ON o.shift_id = s.id
    LEFT JOIN Staff c ON o.cancelled_by = c.id
    WHERE o.status = $1 ORDER BY o.order_time DESC`;
  try {
    const result = await db.query(sql, [req.params.status]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createOrder = async (req, res) => {
  const { table_no, waiter_name, status, order_type } = req.body;
  const userId = req.user?.id;
  const activeShift = userId ? await getActiveShiftForUser(userId) : null;
  const businessDate = activeShift?.business_date || getBusinessDate(new Date());
  const sql = `
    INSERT INTO Orders (table_no, waiter_name, status, order_type, business_date, shift_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, now(), now())
    RETURNING id
  `;
  try {
    const result = await db.query(sql, [table_no, waiter_name, status || 'pending', order_type || 'dine_in', businessDate, activeShift?.id || null]);
    res.status(201).json({ message: 'Order created successfully', order: { id: result.rows[0].id, table_no, waiter_name, status: status || 'pending', order_type: order_type || 'dine_in', business_date: businessDate, shift_id: activeShift?.id || null } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateOrder = async (req, res) => {
  const { table_no, waiter_name, status, order_type } = req.body;
  const sql = 'UPDATE Orders SET table_no = $1, waiter_name = $2, status = $3, order_type = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id';
  try {
    const result = await db.query(sql, [table_no, waiter_name, status, order_type || 'dine_in', req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order updated successfully', order: { id: req.params.id, table_no, waiter_name, status, order_type: order_type || 'dine_in' } });
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

const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user?.id;
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    const existing = await db.query('SELECT * FROM Orders WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Order not found' });

    const order = existing.rows[0];
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    const result = await db.query(
      `UPDATE Orders
       SET status = 'cancelled', cancellation_reason = $1, cancelled_by = $2, cancelled_at = now(), updated_at = now()
       WHERE id = $3 RETURNING *`,
      [String(reason).trim(), userId || null, req.params.id]
    );

    res.json({ message: 'Order cancelled successfully', order: result.rows[0] });
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
  cancelOrder,
  deleteOrder
};
