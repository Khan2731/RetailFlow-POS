require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const password = 'password123';

async function reseed() {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);

    // Clear existing staff
    await db.query('DELETE FROM Staff');

    const staff = [
      ['John Smith', 'john', 'manager', 'morning'],
      ['Sarah Johnson', 'sarah', 'waiter', 'morning'],
      ['Mike Williams', 'mike', 'waiter', 'evening'],
      ['Emily Brown', 'emily', 'chef', 'morning'],
      ['David Davis', 'david', 'chef', 'evening'],
      ['Lisa Wilson', 'lisa', 'cashier', 'morning'],
      ['Tom Miller', 'tom', 'driver', 'evening'],
    ];

    const sql = 'INSERT INTO Staff (name, username, password, role, shift) VALUES ($1, $2, $3, $4, $5)';

    for (const [name, username, role, shift] of staff) {
      try {
        await db.query(sql, [name, username, hash, role, shift]);
        console.log(`Inserted ${username}`);
      } catch (err) {
        console.error('Error inserting staff:', err.message || err);
      }
    }

    console.log('Reseed complete');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

reseed();
