const db = require('../config/database');

const getBusinessDate = (date = new Date()) => {
  const localDate = new Date(date);
  const hour = localDate.getHours();
  const minute = localDate.getMinutes();
  const totalMinutes = hour * 60 + minute;
  if (totalMinutes >= 11 * 60) {
    return localDate.toISOString().slice(0, 10);
  }
  const previousDay = new Date(localDate);
  previousDay.setDate(previousDay.getDate() - 1);
  return previousDay.toISOString().slice(0, 10);
};

const getActiveShift = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM Shifts WHERE cashier_id = $1 AND status = 'open' ORDER BY start_time DESC LIMIT 1`,
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const startShift = async (req, res) => {
  try {
    const active = await db.query(
      `SELECT id FROM Shifts WHERE cashier_id = $1 AND status = 'open'`,
      [req.user.id]
    );
    if (active.rows.length) {
      return res.status(400).json({ error: 'An active shift already exists for this cashier' });
    }

    const openingCash = parseFloat(req.body.opening_cash || 0);
    const businessDate = getBusinessDate(new Date());

    const result = await db.query(
      `INSERT INTO Shifts (cashier_id, business_date, start_time, status, opening_cash, expected_cash)
       VALUES ($1, $2, now(), 'open', $3, $3)
       RETURNING *`,
      [req.user.id, businessDate, openingCash]
    );

    res.status(201).json({ message: 'Shift started successfully', shift: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const closeShift = async (req, res) => {
  try {
    const closingCash = parseFloat(req.body.closing_cash || 0);
    const expectedCash = parseFloat(req.body.expected_cash || 0);
    const cashDifference = closingCash - expectedCash;

    const result = await db.query(
      `UPDATE Shifts
       SET close_time = now(), status = 'closed', closing_cash = $1, expected_cash = $2, cash_difference = $3, updated_at = now()
       WHERE cashier_id = $4 AND status = 'open'
       RETURNING *`,
      [closingCash, expectedCash, cashDifference, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'No active shift found for this cashier' });
    }

    res.json({ message: 'Shift closed successfully', shift: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getActiveShift, startShift, closeShift };
