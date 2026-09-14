const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const name = 'Ali Hassan';
  const username = 'alihassan';
  const password = 'Ali@2026';

  try {
    const existing = await pool.query('SELECT id FROM staff WHERE username = $1', [username]);
    if (existing.rows.length) {
      console.log(JSON.stringify({ message: 'user_exists', username, password, name: existing.rows[0].name || name }));
      await pool.end();
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO staff (name, username, password, role, shift) VALUES ($1,$2,$3,$4,$5)', [name, username, hash, 'manager', 'morning']);
    console.log(JSON.stringify({ name, username, password }));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
