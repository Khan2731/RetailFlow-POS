const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const register = async (req, res) => {
  const { name, username, password, role, shift } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO Staff (name, username, password, role, shift) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    const result = await db.query(sql, [name, username, hash, role, shift]);
    const id = result.rows[0].id;
    const token = jwt.sign({ id, username, role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
    res.status(201).json({ message: 'Staff registered successfully', token, user: { id, name, username, role, shift } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const sql = 'SELECT * FROM Staff WHERE username = $1';
    const result = await db.query(sql, [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, username: user.username, role: user.role, shift: user.shift } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const sql = 'SELECT id, name, username, role, shift, created_at FROM Staff WHERE id = $1';
    const result = await db.query(sql, [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getProfile };
