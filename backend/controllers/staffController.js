const db = require('../config/database');

const getAllStaff = async (req, res) => {
  const sql = 'SELECT id, name, username, role, shift, salary, phone, email, notes, created_at FROM Staff ORDER BY name';
  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStaffById = async (req, res) => {
  const sql = 'SELECT id, name, username, role, shift, salary, phone, email, notes, created_at FROM Staff WHERE id = $1';
  try {
    const result = await db.query(sql, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Staff not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStaffByRole = async (req, res) => {
  const sql = 'SELECT id, name, username, role, shift, salary, phone, email, notes, created_at FROM Staff WHERE role = $1 ORDER BY name';
  try {
    const result = await db.query(sql, [req.params.role]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStaffByShift = async (req, res) => {
  const sql = 'SELECT id, name, username, role, shift, salary, phone, email, notes, created_at FROM Staff WHERE shift = $1 ORDER BY name';
  try {
    const result = await db.query(sql, [req.params.shift]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createStaff = async (req, res) => {
  const { name, username, password, role, shift, salary, phone, email, notes } = req.body;
  const bcrypt = require('bcryptjs');
  const safeSalary = Number.isFinite(Number(salary)) ? Number(salary) : 0;
  const safePhone = phone || null;
  const safeEmail = email || null;
  const safeNotes = notes || null;
  try {
    const hash = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO Staff (name, username, password, role, shift, salary, phone, email, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id';
    const result = await db.query(sql, [name, username, hash, role, shift, safeSalary, safePhone, safeEmail, safeNotes]);
    res.status(201).json({
      message: 'Staff created successfully',
      staff: { id: result.rows[0].id, name, username, role, shift, salary: safeSalary, phone: safePhone, email: safeEmail, notes: safeNotes }
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

const updateStaff = async (req, res) => {
  const { name, username, role, shift, salary, phone, email, notes } = req.body;
  const safeSalary = Number.isFinite(Number(salary)) ? Number(salary) : 0;
  const safePhone = phone || null;
  const safeEmail = email || null;
  const safeNotes = notes || null;
  try {
    const existingResult = await db.query('SELECT id, username FROM Staff WHERE id = $1', [req.params.id]);
    if (!existingResult.rows || existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    if (username !== existingResult.rows[0].username) {
      const duplicateResult = await db.query('SELECT id FROM Staff WHERE username = $1 AND id != $2', [username, req.params.id]);
      if (duplicateResult.rows && duplicateResult.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    const sql = 'UPDATE Staff SET name = $1, username = $2, role = $3, shift = $4, salary = $5, phone = $6, email = $7, notes = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING id';
    const result = await db.query(sql, [name, username, role, shift, safeSalary, safePhone, safeEmail, safeNotes, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Staff updated successfully', staff: { id: req.params.id, name, username, role, shift, salary: safeSalary, phone: safePhone, email: safeEmail, notes: safeNotes } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: err.message });
  }
};

const updateStaffPassword = async (req, res) => {
  const { password } = req.body;
  const bcrypt = require('bcryptjs');
  try {
    const hash = await bcrypt.hash(password, 10);
    const sql = 'UPDATE Staff SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id';
    const result = await db.query(sql, [hash, req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteStaff = async (req, res) => {
  const sql = 'DELETE FROM Staff WHERE id = $1 RETURNING id';
  try {
    const result = await db.query(sql, [req.params.id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Staff deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  getStaffByRole,
  getStaffByShift,
  createStaff,
  updateStaff,
  updateStaffPassword,
  deleteStaff
};
