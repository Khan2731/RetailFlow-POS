require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const username = 'sabirkhan';
const password = 'Khan2731';
const name = 'Sabir Khan';
const role = 'manager';
const shift = 'morning';

async function insertAdmin() {
  try {
    const hash = await bcrypt.hash(password, 10);
    const sqlCheck = 'SELECT id FROM Staff WHERE username = $1';
    const res = await db.query(sqlCheck, [username]);
    if (res.rows && res.rows.length > 0) {
      console.log('Admin user already exists.');
      return process.exit(0);
    }

    const insertSql = 'INSERT INTO Staff (name, username, password, role, shift) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    const insertRes = await db.query(insertSql, [name, username, hash, role, shift]);
    if (insertRes.rows && insertRes.rows[0]) {
      console.log('Admin user inserted: sabirkhan / Khan2731');
    }
    process.exit(0);
  } catch (err) {
    console.error('Insert error:', err.message || err);
    process.exit(1);
  }
}

insertAdmin();
