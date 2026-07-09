require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const schemaPath = path.join(__dirname, '..', 'schema.sql');
const settingsPath = path.join(__dirname, '..', 'migrations', 'init_settings.sql');

async function init() {
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schema);
    const settingsSchema = fs.readFileSync(settingsPath, 'utf8');
    await db.query(settingsSchema);
    console.log('Database schema created successfully');
    // Do not end pool here; caller can decide
  } catch (err) {
    console.error('Error creating database schema:', err.message);
    process.exit(1);
  }
}

init();
