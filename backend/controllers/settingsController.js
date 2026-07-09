const db = require('../config/database');

const getSettings = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Settings LIMIT 1');
    if (result.rows.length === 0) return res.json({ settings: {} });
    res.json({ settings: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSettings = async (req, res) => {
  const { restaurant_name, tagline, contact_number } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO Settings (restaurant_name, tagline, contact_number)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         restaurant_name = EXCLUDED.restaurant_name,
         tagline = EXCLUDED.tagline,
         contact_number = EXCLUDED.contact_number
       RETURNING *`,
      [restaurant_name, tagline, contact_number]
    );
    res.json({ message: 'Settings updated successfully', settings: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSettings, updateSettings };
