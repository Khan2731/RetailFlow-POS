const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const username = 'alihassan';
    const password = 'Ali@2026';
    const res = await pool.query('SELECT id, username, password, role, shift FROM staff WHERE username = $1', [username]);
    const user = res.rows[0];
    console.log(JSON.stringify({ user }, null, 2));
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      console.log('MATCH', match);
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
