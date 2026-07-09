require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const seedPath = path.join(__dirname, '..', 'seed.sql');

async function seed() {
  try {
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await db.query(seedSql);
    console.log('Database seeded successfully');
  } catch (err) {
    console.error('Error seeding database:', err.message);
    process.exit(1);
  }
}

seed();
