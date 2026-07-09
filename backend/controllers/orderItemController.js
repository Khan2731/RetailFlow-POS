const db = require('../config/database');

const getOrderItemsByOrderId = async (req, res) => {
  const sql = `
    SELECT oi.*, p.name as product_name, p.base_price as price, p.category, 
           (oi.quantity * p.base_price) as line_total
    FROM OrderItems oi
    JOIN Products p ON oi.product_id = p.id
    WHERE oi.order_id = $1
  `;
  try {
    const result = await db.query(sql, [req.params.order_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOrderItemById = async (req, res) => {
  const sql = `
    SELECT oi.*, p.name as product_name, p.base_price as price, p.category,
           (oi.quantity * p.base_price) as line_total
    FROM OrderItems oi
    JOIN Products p ON oi.product_id = p.id
    WHERE oi.id = $1
  `;
  try {
    const result = await db.query(sql, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Order item not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createOrderItem = async (req, res) => {
  const { order_id, product_id, quantity } = req.body;
  const sql = 'INSERT INTO OrderItems (order_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING id';
  try {
    const result = await db.query(sql, [order_id, product_id, quantity]);

    // Reduce inventory for the product (simplified - assumes 1 unit per product)
    const inventorySql = "UPDATE Inventory SET quantity = quantity - 1 WHERE item_name ILIKE '%Pizza%' OR item_name ILIKE '%Dough%'";
    try {
      await db.query(inventorySql);
    } catch (inventoryErr) {
      console.error('Failed to update inventory:', inventoryErr.message || inventoryErr);
    }

    res.status(201).json({ message: 'Order item created successfully', orderItem: { id: result.rows[0].id, order_id, product_id, quantity } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateOrderItem = async (req, res) => {
  const { order_id, product_id, quantity } = req.body;
  const sql = 'UPDATE OrderItems SET order_id = $1, product_id = $2, quantity = $3 WHERE id = $4 RETURNING id';
  try {
    const result = await db.query(sql, [order_id, product_id, quantity, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Order item not found' });
    res.json({ message: 'Order item updated successfully', orderItem: { id: req.params.id, order_id, product_id, quantity } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteOrderItem = async (req, res) => {
  const sql = 'DELETE FROM OrderItems WHERE id = $1 RETURNING id';
  try {
    const result = await db.query(sql, [req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Order item not found' });
    res.json({ message: 'Order item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getOrderItemsByOrderId,
  getOrderItemById,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem
};
