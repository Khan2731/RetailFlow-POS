const db = require('../config/database');

// Get all deals
const getAllDeals = async (req, res) => {
  const sql = `
    SELECT d.*, 
           STRING_AGG(
             json_build_object('product_id', di.product_id, 'quantity', di.quantity, 'size', di.size, 'product_name', p.name)::text, ',') as items
    FROM Deals d
    LEFT JOIN DealItems di ON d.id = di.deal_id
    LEFT JOIN Products p ON di.product_id = p.id
    WHERE d.is_active = true
    GROUP BY d.id
  `;
  try {
    const result = await db.query(sql);
    const deals = result.rows.map(row => ({
      ...row,
      items: row.items ? JSON.parse(`[${row.items}]`) : []
    }));
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get deal by ID
const getDealById = async (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT d.*, 
           STRING_AGG(
             json_build_object('product_id', di.product_id, 'quantity', di.quantity, 'size', di.size, 'product_name', p.name)::text, ',') as items
    FROM Deals d
    LEFT JOIN DealItems di ON d.id = di.deal_id
    LEFT JOIN Products p ON di.product_id = p.id
    WHERE d.id = $1
    GROUP BY d.id
  `;
  try {
    const result = await db.query(sql, [id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Deal not found' });
    const deal = { ...row, items: row.items ? JSON.parse(`[${row.items}]`) : [] };
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new deal
const createDeal = async (req, res) => {
  const { name, description, deal_price, items } = req.body;
  const parsedDealPrice = parseFloat(deal_price);

  if (!name || isNaN(parsedDealPrice) || parsedDealPrice < 0 || !items || items.length === 0) {
    return res.status(400).json({ error: 'Name, deal price, and at least one item are required' });
  }

  const sql = 'INSERT INTO Deals (name, description, deal_price) VALUES ($1, $2, $3) RETURNING id';
  try {
    const insertRes = await db.query(sql, [name, description, parsedDealPrice]);
    const dealId = insertRes.rows[0].id;

    const itemSql = 'INSERT INTO DealItems (deal_id, product_id, quantity, size) VALUES ($1, $2, $3, $4)';
    for (const item of items) {
      const productId = parseInt(item.product_id, 10);
      const quantity = parseInt(item.quantity, 10);
      const size = item.size || null;
      if (isNaN(productId) || isNaN(quantity) || quantity < 1) continue;
      try {
        await db.query(itemSql, [dealId, productId, quantity, size]);
      } catch (insertErr) {
        console.error('Error inserting deal item:', insertErr.message || insertErr);
      }
    }

    res.status(201).json({ message: 'Deal created successfully', deal: { id: dealId, name, description, deal_price: parsedDealPrice, items } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update deal
const updateDeal = async (req, res) => {
  const { id } = req.params;
  const { name, description, deal_price, is_active, items } = req.body;
  const sql = 'UPDATE Deals SET name = $1, description = $2, deal_price = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5';
  try {
    await db.query(sql, [name, description, deal_price, is_active, id]);
    // Delete existing deal items
    await db.query('DELETE FROM DealItems WHERE deal_id = $1', [id]);
    // Insert new deal items
    if (items && items.length > 0) {
      const itemSql = 'INSERT INTO DealItems (deal_id, product_id, quantity, size) VALUES ($1, $2, $3, $4)';
      for (const item of items) {
        try {
          await db.query(itemSql, [id, item.product_id, item.quantity, item.size || null]);
        } catch (err) {
          console.error('Error inserting deal item:', err.message || err);
        }
      }
    }
    res.json({ message: 'Deal updated successfully', deal: { id, name, description, deal_price, is_active, items } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete deal
const deleteDeal = async (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Deals WHERE id = $1 RETURNING id';
  try {
    const result = await db.query(sql, [id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    res.json({ message: 'Deal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal
};
