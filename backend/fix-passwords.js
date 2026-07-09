require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const password = 'password123';

async function fixPasswords() {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('New hash:', hash);
    const sql = 'UPDATE Staff SET password = $1';
    const result = await db.query(sql, [hash]);
    console.log('Passwords updated');
    process.exit(0);
  } catch (err) {
    console.error('Error updating passwords:', err.message || err);
    process.exit(1);
  }
}

fixPasswords();
