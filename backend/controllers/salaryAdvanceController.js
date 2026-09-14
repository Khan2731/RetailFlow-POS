const db = require('../config/database');

// GET /api/salary-advances?employee_id=&month=&year=&status=&page=&limit=
const getSalaryAdvances = async (req, res) => {
  try {
    const { employee_id, month, year, status, page = 1, limit = 50 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (employee_id) { conditions.push(`sa.employee_id = $${idx++}`); params.push(employee_id); }
    if (status) { conditions.push(`sa.status = $${idx++}`); params.push(status); }
    if (month && year) {
      conditions.push(`EXTRACT(MONTH FROM sa.advance_date) = $${idx++}`);
      params.push(month);
      conditions.push(`EXTRACT(YEAR FROM sa.advance_date) = $${idx++}`);
      params.push(year);
    } else if (year) {
      conditions.push(`EXTRACT(YEAR FROM sa.advance_date) = $${idx++}`);
      params.push(year);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM SalaryAdvances sa ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit));
    params.push(offset);

    const result = await db.query(
      `SELECT sa.id, sa.employee_id, sa.amount, sa.advance_date::text as advance_date,
              sa.reason, sa.payment_method, sa.status, sa.recovered_amount,
              sa.remaining_amount, sa.notes, sa.created_at, sa.updated_at,
              s.name as employee_name, s.role, s.shift
       FROM SalaryAdvances sa
       JOIN Staff s ON sa.employee_id = s.id
       ${where}
       ORDER BY sa.advance_date DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );

    res.json({ data: result.rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/salary-advances/pending  — advances with remaining_amount > 0
const getPendingRecoveries = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT sa.id, sa.employee_id, sa.amount, sa.advance_date::text as advance_date,
              sa.reason, sa.payment_method, sa.status, sa.recovered_amount,
              sa.remaining_amount, sa.notes, sa.created_at, sa.updated_at,
              s.name as employee_name, s.role, s.shift
       FROM SalaryAdvances sa
       JOIN Staff s ON sa.employee_id = s.id
       WHERE sa.remaining_amount > 0
       ORDER BY sa.advance_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/salary-advances/:id
const getSalaryAdvanceById = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT sa.*, s.name as employee_name, s.role
       FROM SalaryAdvances sa
       JOIN Staff s ON sa.employee_id = s.id
       WHERE sa.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Advance not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/salary-advances
const createSalaryAdvance = async (req, res) => {
  try {
    const { employee_id, amount, advance_date, reason, payment_method, notes } = req.body;
    const createdBy = req.user?.id || null;
    const amt = parseFloat(amount);

    const result = await db.query(
      `INSERT INTO SalaryAdvances (employee_id, amount, advance_date, reason, payment_method, status, recovered_amount, remaining_amount, notes, created_by, updated_by)
       VALUES ($1, $2, $3::date, $4, $5, 'pending', 0, $2, $6, $7, $7)
       RETURNING id, employee_id, amount, advance_date::text as advance_date, reason, payment_method, status, recovered_amount, remaining_amount, notes, created_at, updated_at`,
      [parseInt(employee_id), amt, advance_date, reason || null, payment_method || 'cash', notes || null, createdBy]
    );

    res.status(201).json({ message: 'Salary advance created successfully', advance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/salary-advances/:id
const updateSalaryAdvance = async (req, res) => {
  try {
    const { employee_id, amount, advance_date, reason, payment_method, notes } = req.body;
    const updatedBy = req.user?.id || null;
    const amt = parseFloat(amount);

    const existing = await db.query('SELECT * FROM SalaryAdvances WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Advance not found' });

    const recovered = parseFloat(existing.rows[0].recovered_amount) || 0;
    const remaining = Math.max(0, amt - recovered);
    let status = 'pending';
    if (remaining === 0) status = 'fully_recovered';
    else if (recovered > 0) status = 'partially_recovered';

    const result = await db.query(
      `UPDATE SalaryAdvances
       SET employee_id = $1, amount = $2, advance_date = $3::date, reason = $4, payment_method = $5,
           remaining_amount = $6, status = $7, notes = $8, updated_by = $9, updated_at = now()
       WHERE id = $10 RETURNING id, employee_id, amount, advance_date::text as advance_date,
             reason, payment_method, status, recovered_amount, remaining_amount, notes`,
      [parseInt(employee_id), amt, advance_date, reason || null, payment_method || 'cash', remaining, status, notes || null, updatedBy, req.params.id]
    );

    res.json({ message: 'Advance updated successfully', advance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/salary-advances/:id/recover  — partial or full recovery
const recoverAdvance = async (req, res) => {
  try {
    const { recover_amount } = req.body;
    const updatedBy = req.user?.id || null;
    const recoverAmt = parseFloat(recover_amount);

    if (!recoverAmt || recoverAmt <= 0) {
      return res.status(400).json({ error: 'Recovery amount must be greater than zero' });
    }

    const existing = await db.query('SELECT * FROM SalaryAdvances WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Advance not found' });

    const advance = existing.rows[0];
    const currentRemaining = parseFloat(advance.remaining_amount);

    if (recoverAmt > currentRemaining) {
      return res.status(400).json({ error: `Cannot recover more than remaining amount (Rs. ${currentRemaining.toFixed(2)})` });
    }

    const newRecovered = parseFloat(advance.recovered_amount) + recoverAmt;
    const newRemaining = parseFloat(advance.amount) - newRecovered;
    let status = 'partially_recovered';
    if (newRemaining <= 0) status = 'fully_recovered';

    const result = await db.query(
      `UPDATE SalaryAdvances
       SET recovered_amount = $1, remaining_amount = $2, status = $3, updated_by = $4, updated_at = now()
       WHERE id = $5 RETURNING *`,
      [newRecovered, Math.max(0, newRemaining), status, updatedBy, req.params.id]
    );

    res.json({ message: 'Recovery recorded successfully', advance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/salary-advances/:id
const deleteSalaryAdvance = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM SalaryAdvances WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Advance not found' });
    res.json({ message: 'Advance deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/salary-advances/stats  — for dashboard
const getAdvanceStats = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         COUNT(CASE WHEN status != 'fully_recovered' THEN 1 END) as pending_count,
         COALESCE(SUM(CASE WHEN status != 'fully_recovered' THEN remaining_amount ELSE 0 END), 0) as total_outstanding
       FROM SalaryAdvances`
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSalaryAdvances,
  getPendingRecoveries,
  getSalaryAdvanceById,
  createSalaryAdvance,
  updateSalaryAdvance,
  recoverAdvance,
  deleteSalaryAdvance,
  getAdvanceStats,
};
