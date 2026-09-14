const db = require('../config/database');

// GET /api/inventory-movements?item_id=&type=&page=&limit=
const getMovements = async (req, res) => {
  try {
    const { item_id, movement_type, page = 1, limit = 50 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (item_id) { conditions.push(`m.inventory_item_id = $${idx++}`); params.push(parseInt(item_id)); }
    if (movement_type) { conditions.push(`m.movement_type = $${idx++}`); params.push(movement_type); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await db.query(`SELECT COUNT(*) FROM InventoryMovements m ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataParams = [...params, parseInt(limit), offset];
    const result = await db.query(
      `SELECT m.*, m.movement_date::text as movement_date,
              i.item_name, i.unit,
              v.company_name as vendor_name
       FROM InventoryMovements m
       JOIN Inventory i ON m.inventory_item_id = i.id
       LEFT JOIN Vendors v ON m.vendor_id = v.id
       ${where}
       ORDER BY m.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      dataParams
    );

    res.json({ data: result.rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/inventory-movements — record a movement
const createMovement = async (req, res) => {
  try {
    const { inventory_item_id, movement_type, quantity, reason, reference, vendor_id, purchase_price, movement_date } = req.body;
    const createdBy = req.user?.id || null;
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ error: 'Quantity must be positive' });

    // Get current quantity
    const invResult = await db.query('SELECT quantity FROM Inventory WHERE id=$1', [inventory_item_id]);
    if (!invResult.rows.length) return res.status(404).json({ error: 'Inventory item not found' });
    const prevQty = parseFloat(invResult.rows[0].quantity);

    let newQty = prevQty;
    if (movement_type === 'stock_in' || movement_type === 'return') {
      newQty = prevQty + qty;
    } else if (movement_type === 'stock_out' || movement_type === 'wastage') {
      if (qty > prevQty) return res.status(400).json({ error: `Cannot remove ${qty}. Only ${prevQty} in stock.` });
      newQty = prevQty - qty;
    } else if (movement_type === 'adjustment') {
      // qty is the new absolute value
      newQty = qty;
    }

    // Update inventory
    await db.query('UPDATE Inventory SET quantity=$1, updated_at=now() WHERE id=$2', [newQty, inventory_item_id]);

    // Record movement
    const result = await db.query(
      `INSERT INTO InventoryMovements (inventory_item_id, movement_type, quantity, previous_quantity, updated_quantity, reason, reference, vendor_id, purchase_price, movement_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::date,$11)
       RETURNING *, movement_date::text as movement_date`,
      [parseInt(inventory_item_id), movement_type, qty, prevQty, newQty, reason || null, reference || null, vendor_id || null, purchase_price ? parseFloat(purchase_price) : null, movement_date || new Date().toISOString().split('T')[0], createdBy]
    );

    res.status(201).json({ message: 'Movement recorded', movement: result.rows[0], new_quantity: newQty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/inventory-movements/stats — dashboard
const getInventoryStats = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         COUNT(*) as total_items,
         COALESCE(SUM(i.quantity * i.price), 0) as inventory_value,
         COUNT(CASE WHEN i.quantity = 0 THEN 1 END) as out_of_stock,
         COUNT(CASE WHEN i.quantity > 0 AND i.quantity <= COALESCE(i.minimum_quantity, 10) THEN 1 END) as low_stock
       FROM Inventory i WHERE i.status != 'inactive' OR i.status IS NULL`
    );

    const today = new Date().toISOString().split('T')[0];
    const todayResult = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN movement_type='stock_in' THEN quantity ELSE 0 END),0) as added_today,
         COALESCE(SUM(CASE WHEN movement_type='stock_out' THEN quantity ELSE 0 END),0) as used_today,
         COALESCE(SUM(CASE WHEN movement_type='wastage' THEN quantity ELSE 0 END),0) as waste_today
       FROM InventoryMovements WHERE movement_date=$1::date`,
      [today]
    );

    res.json({ ...result.rows[0], ...todayResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMovements, createMovement, getInventoryStats };
