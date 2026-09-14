const db = require('../config/database');

const getAllInventory = async (req, res) => {
  const sql = 'SELECT * FROM Inventory ORDER BY item_name';
  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getInventoryById = async (req, res) => {
  const sql = 'SELECT * FROM Inventory WHERE id = $1';
  try {
    const result = await db.query(sql, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLowStockItems = async (req, res) => {
  const threshold = req.query.threshold || 10;
  const sql = 'SELECT * FROM Inventory WHERE quantity <= $1 ORDER BY quantity';
  try {
    const result = await db.query(sql, [threshold]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createInventory = async (req, res) => {
  const { item_name, quantity, unit, price } = req.body;
  const parsedPrice = price !== undefined && price !== null ? parseFloat(price) : null;
  const sql = 'INSERT INTO Inventory (item_name, quantity, unit, price) VALUES ($1, $2, $3, $4) RETURNING id';
  try {
    const result = await db.query(sql, [item_name, quantity, unit, parsedPrice]);
    res.status(201).json({ message: 'Inventory item created successfully', inventory: { id: result.rows[0].id, item_name, quantity, unit, price: parsedPrice } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Item already exists' });
    res.status(500).json({ error: err.message });
  }
};

const updateInventory = async (req, res) => {
  const { item_name, quantity, unit, price } = req.body;
  const parsedPrice = price !== undefined && price !== null ? parseFloat(price) : null;
  const sql = 'UPDATE Inventory SET item_name = $1, quantity = $2, unit = $3, price = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id';
  try {
    const result = await db.query(sql, [item_name, quantity, unit, parsedPrice, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ message: 'Inventory updated successfully', inventory: { id: req.params.id, item_name, quantity, unit, price: parsedPrice } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Item name already exists' });
    res.status(500).json({ error: err.message });
  }
};

const updateInventoryQuantity = async (req, res) => {
  const { quantity } = req.body;
  const sql = 'UPDATE Inventory SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id';
  try {
    const result = await db.query(sql, [quantity, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ message: 'Inventory quantity updated successfully', inventory: { id: req.params.id, quantity } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const adjustInventoryQuantity = async (req, res) => {
  const { adjustment } = req.body;
  const sql = 'UPDATE Inventory SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id';
  try {
    const result = await db.query(sql, [adjustment, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ message: 'Inventory quantity adjusted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteInventory = async (req, res) => {
  const sql = 'DELETE FROM Inventory WHERE id = $1 RETURNING id';
  try {
    const result = await db.query(sql, [req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllInventory,
  getInventoryById,
  getLowStockItems,
  createInventory,
  updateInventory,
  updateInventoryQuantity,
  adjustInventoryQuantity,
  deleteInventory
};
