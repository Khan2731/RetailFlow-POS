const db = require('../config/database');

// Generate vendor code: VND-001, VND-002, ...
const generateVendorCode = async () => {
  const result = await db.query(
    `SELECT vendor_code FROM Vendors ORDER BY id DESC LIMIT 1`
  );
  if (!result.rows.length) return 'VND-001';
  const last = result.rows[0].vendor_code;
  const num = parseInt(last.replace('VND-', '')) + 1;
  return `VND-${String(num).padStart(3, '0')}`;
};

// GET /api/vendors?status=&search=&page=&limit=
const getVendors = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`v.status = $${idx++}`); params.push(status); }
    if (search) {
      conditions.push(`(v.company_name ILIKE $${idx} OR v.contact_person ILIKE $${idx} OR v.phone ILIKE $${idx} OR v.vendor_code ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await db.query(`SELECT COUNT(*) FROM Vendors v ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataParams = [...params, parseInt(limit), offset];
    const result = await db.query(
      `SELECT v.*,
         COALESCE((SELECT SUM(vpur.total_amount) FROM VendorPurchases vpur WHERE vpur.vendor_id = v.id), 0) as total_purchases,
         COALESCE((SELECT SUM(vpay.amount) FROM VendorPayments vpay WHERE vpay.vendor_id = v.id), 0) as total_paid,
         (SELECT vpur2.purchase_date::text FROM VendorPurchases vpur2 WHERE vpur2.vendor_id = v.id ORDER BY vpur2.purchase_date DESC LIMIT 1) as last_purchase_date
       FROM Vendors v
       ${where}
       ORDER BY v.company_name ASC
       LIMIT $${idx++} OFFSET $${idx++}`,
      dataParams
    );

    // Calculate outstanding balance
    const rows = result.rows.map(v => ({
      ...v,
      outstanding_balance: parseFloat(v.total_purchases || 0) + parseFloat(v.opening_balance || 0) - parseFloat(v.total_paid || 0),
    }));

    res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vendors/:id
const getVendorById = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT v.*,
         COALESCE((SELECT SUM(vpur.total_amount) FROM VendorPurchases vpur WHERE vpur.vendor_id = v.id), 0) as total_purchases,
         COALESCE((SELECT SUM(vpay.amount) FROM VendorPayments vpay WHERE vpay.vendor_id = v.id), 0) as total_paid
       FROM Vendors v WHERE v.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const v = result.rows[0];
    v.outstanding_balance = parseFloat(v.total_purchases || 0) + parseFloat(v.opening_balance || 0) - parseFloat(v.total_paid || 0);
    res.json(v);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/vendors
const createVendor = async (req, res) => {
  try {
    const { company_name, contact_person, phone, whatsapp, email, address, city, country, tax_number, opening_balance, credit_limit, payment_terms, notes, status } = req.body;
    const vendor_code = await generateVendorCode();

    const result = await db.query(
      `INSERT INTO Vendors (vendor_code, company_name, contact_person, phone, whatsapp, email, address, city, country, tax_number, opening_balance, credit_limit, payment_terms, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [vendor_code, company_name, contact_person || null, phone || null, whatsapp || null, email || null, address || null, city || null, country || 'Pakistan', tax_number || null, parseFloat(opening_balance) || 0, parseFloat(credit_limit) || 0, payment_terms || 'immediate', notes || null, status || 'active']
    );
    res.status(201).json({ message: 'Vendor created successfully', vendor: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Vendor code already exists' });
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/vendors/:id
const updateVendor = async (req, res) => {
  try {
    const { company_name, contact_person, phone, whatsapp, email, address, city, country, tax_number, opening_balance, credit_limit, payment_terms, notes, status } = req.body;

    const result = await db.query(
      `UPDATE Vendors SET company_name=$1, contact_person=$2, phone=$3, whatsapp=$4, email=$5, address=$6, city=$7, country=$8, tax_number=$9, opening_balance=$10, credit_limit=$11, payment_terms=$12, notes=$13, status=$14, updated_at=now()
       WHERE id=$15 RETURNING *`,
      [company_name, contact_person || null, phone || null, whatsapp || null, email || null, address || null, city || null, country || 'Pakistan', tax_number || null, parseFloat(opening_balance) || 0, parseFloat(credit_limit) || 0, payment_terms || 'immediate', notes || null, status || 'active', req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Vendor updated successfully', vendor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/vendors/:id
const deleteVendor = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM Vendors WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Vendor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Vendor Payments ---
// GET /api/vendors/:id/payments
const getVendorPayments = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT vp.*, vp.payment_date::text as payment_date FROM VendorPayments vp WHERE vp.vendor_id=$1 ORDER BY vp.payment_date DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/vendors/:id/payments
const createVendorPayment = async (req, res) => {
  try {
    const { payment_date, amount, payment_method, reference_number, notes } = req.body;
    const createdBy = req.user?.id || null;
    const result = await db.query(
      `INSERT INTO VendorPayments (vendor_id, payment_date, amount, payment_method, reference_number, notes, created_by)
       VALUES ($1, $2::date, $3, $4, $5, $6, $7)
       RETURNING *, payment_date::text as payment_date`,
      [req.params.id, payment_date, parseFloat(amount), payment_method || 'cash', reference_number || null, notes || null, createdBy]
    );
    res.status(201).json({ message: 'Payment recorded', payment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/vendors/payments/:id
const deleteVendorPayment = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM VendorPayments WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Vendor Purchases ---
// GET /api/vendors/:id/purchases
const getVendorPurchases = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT vp.*, vp.purchase_date::text as purchase_date FROM VendorPurchases vp WHERE vp.vendor_id=$1 ORDER BY vp.purchase_date DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/vendors/:id/purchases
const createVendorPurchase = async (req, res) => {
  try {
    const { inventory_item_id, item_name, purchase_date, quantity, unit, unit_price, notes } = req.body;
    const createdBy = req.user?.id || null;
    const total_amount = parseFloat(quantity) * parseFloat(unit_price);

    const result = await db.query(
      `INSERT INTO VendorPurchases (vendor_id, inventory_item_id, item_name, purchase_date, quantity, unit, unit_price, total_amount, notes, created_by)
       VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10)
       RETURNING *, purchase_date::text as purchase_date`,
      [req.params.id, inventory_item_id || null, item_name, purchase_date, parseFloat(quantity), unit || null, parseFloat(unit_price), total_amount, notes || null, createdBy]
    );

    // If linked to inventory item, add a stock_in movement and update quantity
    if (inventory_item_id) {
      const inv = await db.query('SELECT quantity FROM Inventory WHERE id=$1', [inventory_item_id]);
      if (inv.rows.length) {
        const prevQty = parseFloat(inv.rows[0].quantity);
        const newQty = prevQty + parseFloat(quantity);
        await db.query(
          `UPDATE Inventory SET quantity=$1, updated_at=now() WHERE id=$2`,
          [newQty, inventory_item_id]
        );
        await db.query(
          `INSERT INTO InventoryMovements (inventory_item_id, movement_type, quantity, previous_quantity, updated_quantity, reason, vendor_id, purchase_price, movement_date, created_by)
           VALUES ($1,'stock_in',$2,$3,$4,'Vendor purchase',$5,$6,$7::date,$8)`,
          [inventory_item_id, parseFloat(quantity), prevQty, newQty, req.params.id, parseFloat(unit_price), purchase_date, createdBy]
        );
      }
    }

    res.status(201).json({ message: 'Purchase recorded', purchase: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/vendors/stats — dashboard
const getVendorStats = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         COUNT(*) as total_vendors,
         COUNT(CASE WHEN status='active' THEN 1 END) as active_vendors,
         COALESCE(SUM(opening_balance),0) as total_opening_balance
       FROM Vendors`
    );
    const purchaseResult = await db.query(
      `SELECT COALESCE(SUM(total_amount),0) as total_purchases FROM VendorPurchases`
    );
    const paymentResult = await db.query(
      `SELECT COALESCE(SUM(amount),0) as total_paid FROM VendorPayments`
    );    const stats = result.rows[0];
    stats.total_purchases = purchaseResult.rows[0].total_purchases;
    stats.total_paid = paymentResult.rows[0].total_paid;
    stats.outstanding = parseFloat(stats.total_purchases) + parseFloat(stats.total_opening_balance) - parseFloat(stats.total_paid);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getVendors, getVendorById, createVendor, updateVendor, deleteVendor,
  getVendorPayments, createVendorPayment, deleteVendorPayment,
  getVendorPurchases, createVendorPurchase,
  getVendorStats,
};
