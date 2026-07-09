require('dotenv').config();
const db = require('./config/database');

async function checkAdmin() {
  try {
    const res = await db.query("SELECT id, name, username, role FROM Staff WHERE username IN ($1, $2)", ['sabirkhan', 'admin']);
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

checkAdmin();
