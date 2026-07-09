const db = require('../config/database');

const getAllDeliveries = async (req, res) => {
  const sql = `
    SELECT d.*, o.table_no, o.waiter_name, o.order_time
    FROM Delivery d
    JOIN Orders o ON d.order_id = o.id
    ORDER BY d.created_at DESC
  `;
  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDeliveryById = async (req, res) => {
  const sql = `
    SELECT d.*, o.table_no, o.waiter_name, o.order_time
    FROM Delivery d
    JOIN Orders o ON d.order_id = o.id
    WHERE d.id = $1
  `;
  try {
    const result = await db.query(sql, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Delivery not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDeliveryByOrderId = async (req, res) => {
  const sql = `
    SELECT d.*, o.table_no, o.waiter_name, o.order_time
    FROM Delivery d
    JOIN Orders o ON d.order_id = o.id
    WHERE d.order_id = $1
  `;
  try {
    const result = await db.query(sql, [req.params.order_id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Delivery not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDeliveriesByStatus = async (req, res) => {
  const sql = `
    SELECT d.*, o.table_no, o.waiter_name, o.order_time
    FROM Delivery d
    JOIN Orders o ON d.order_id = o.id
    WHERE d.status = $1
    ORDER BY d.created_at DESC
  `;
  try {
    const result = await db.query(sql, [req.params.status]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDeliveriesByDriver = async (req, res) => {
  const sql = `
    SELECT d.*, o.table_no, o.waiter_name, o.order_time
    FROM Delivery d
    JOIN Orders o ON d.order_id = o.id
    WHERE d.driver_name = $1
    ORDER BY d.created_at DESC
  `;
  try {
    const result = await db.query(sql, [req.params.driver_name]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createDelivery = async (req, res) => {
  const { order_id, customer_name, address, phone, driver_name, delivery_fee, status } = req.body;
  const sql = 'INSERT INTO Delivery (order_id, customer_name, address, phone, driver_name, delivery_fee, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';
  try {
    const result = await db.query(sql, [order_id, customer_name, address, phone, driver_name || null, delivery_fee, status || 'pending']);
    res.status(201).json({ message: 'Delivery created successfully', delivery: { id: result.rows[0].id, order_id, customer_name, address, phone, driver_name, delivery_fee, status: status || 'pending' } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Delivery already exists for this order' });
    res.status(500).json({ error: err.message });
  }
};

const updateDelivery = async (req, res) => {
  const { customer_name, address, phone, driver_name, delivery_fee, status } = req.body;
  const sql = 'UPDATE Delivery SET customer_name = $1, address = $2, phone = $3, driver_name = $4, delivery_fee = $5, status = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING id';
  try {
    const result = await db.query(sql, [customer_name, address, phone, driver_name, delivery_fee, status, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    res.json({ message: 'Delivery updated successfully', delivery: { id: req.params.id, customer_name, address, phone, driver_name, delivery_fee, status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateDeliveryStatus = async (req, res) => {
  const { status, driver_name } = req.body;
  const sql = 'UPDATE Delivery SET status = $1, driver_name = COALESCE($2, driver_name), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id';
  try {
    const result = await db.query(sql, [status, driver_name, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    res.json({ message: 'Delivery status updated successfully', delivery: { id: req.params.id, status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const assignDriver = async (req, res) => {
  const { driver_name } = req.body;
  const sql = 'UPDATE Delivery SET driver_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id';
  try {
    const result = await db.query(sql, [driver_name, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    res.json({ message: 'Driver assigned successfully', delivery: { id: req.params.id, driver_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteDelivery = async (req, res) => {
  const sql = 'DELETE FROM Delivery WHERE id = $1 RETURNING id';
  try {
    const result = await db.query(sql, [req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    res.json({ message: 'Delivery deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllDeliveries,
  getDeliveryById,
  getDeliveryByOrderId,
  getDeliveriesByStatus,
  getDeliveriesByDriver,
  createDelivery,
  updateDelivery,
  updateDeliveryStatus,
  assignDriver,
  deleteDelivery
};
