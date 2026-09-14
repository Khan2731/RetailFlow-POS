const db = require('../config/database');

// Helper: safely cast date string to avoid pg timezone shifting
// Pass dates as text to SQL and cast with ::date to keep them as-is
const safeDate = (d) => d; // pass through; we cast in SQL

// GET /api/attendance?date=YYYY-MM-DD&employee_id=&month=&year=&status=&page=&limit=
const getAttendance = async (req, res) => {
  try {
    const { date, employee_id, month, year, status, page = 1, limit = 100 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (date) {
      conditions.push(`a.date = $${idx++}::date`);
      params.push(date);
    }
    if (employee_id) {
      conditions.push(`a.employee_id = $${idx++}`);
      params.push(parseInt(employee_id));
    }
    if (month) {
      conditions.push(`EXTRACT(MONTH FROM a.date) = $${idx++}`);
      params.push(parseInt(month));
    }
    if (year) {
      conditions.push(`EXTRACT(YEAR FROM a.date) = $${idx++}`);
      params.push(parseInt(year));
    }
    if (status) {
      conditions.push(`a.status = $${idx++}`);
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM Attendance a ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataParams = [...params, parseInt(limit), offset];

    const result = await db.query(
      `SELECT a.id, a.employee_id, a.date::text as date, a.status,
              a.check_in::text as check_in, a.check_out::text as check_out,
              a.overtime_minutes, a.notes, a.created_at, a.updated_at,
              s.name as employee_name, s.role, s.shift
       FROM Attendance a
       JOIN Staff s ON a.employee_id = s.id
       ${where}
       ORDER BY a.date DESC, s.name ASC
       LIMIT $${idx++} OFFSET $${idx++}`,
      dataParams
    );

    res.json({ data: result.rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/attendance/daily?date=YYYY-MM-DD
const getDailyAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `SELECT s.id as employee_id, s.name as employee_name, s.role, s.shift, s.salary,
              a.id as attendance_id, a.status,
              a.check_in::text as check_in,
              a.check_out::text as check_out,
              a.overtime_minutes, a.notes,
              a.date::text as date
       FROM Staff s
       LEFT JOIN Attendance a ON a.employee_id = s.id AND a.date = $1::date
       ORDER BY s.name ASC`,
      [targetDate]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/attendance — upsert single record
const upsertAttendance = async (req, res) => {
  try {
    const { employee_id, date, status, check_in, check_out, overtime_minutes, notes } = req.body;
    const createdBy = req.user?.id || null;

    const result = await db.query(
      `INSERT INTO Attendance (employee_id, date, status, check_in, check_out, overtime_minutes, notes, created_by, updated_by)
       VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $8)
       ON CONFLICT (employee_id, date)
       DO UPDATE SET
         status         = EXCLUDED.status,
         check_in       = EXCLUDED.check_in,
         check_out      = EXCLUDED.check_out,
         overtime_minutes = EXCLUDED.overtime_minutes,
         notes          = EXCLUDED.notes,
         updated_by     = $8,
         updated_at     = now()
       RETURNING id, employee_id, date::text as date, status,
                 check_in::text as check_in, check_out::text as check_out,
                 overtime_minutes, notes`,
      [
        parseInt(employee_id),
        date,
        status,
        check_in || null,
        check_out || null,
        parseInt(overtime_minutes) || 0,
        notes || null,
        createdBy,
      ]
    );

    res.status(201).json({ message: 'Attendance saved successfully', attendance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/attendance/bulk — save all employees at once
const bulkUpsertAttendance = async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array is required' });
    }

    const createdBy = req.user?.id || null;
    const saved = [];

    for (const rec of records) {
      const { employee_id, date, status, check_in, check_out, overtime_minutes, notes } = rec;
      if (!employee_id || !date || !status) continue;

      const result = await db.query(
        `INSERT INTO Attendance (employee_id, date, status, check_in, check_out, overtime_minutes, notes, created_by, updated_by)
         VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $8)
         ON CONFLICT (employee_id, date)
         DO UPDATE SET
           status           = EXCLUDED.status,
           check_in         = EXCLUDED.check_in,
           check_out        = EXCLUDED.check_out,
           overtime_minutes = EXCLUDED.overtime_minutes,
           notes            = EXCLUDED.notes,
           updated_by       = $8,
           updated_at       = now()
         RETURNING id, employee_id, date::text as date, status,
                   check_in::text as check_in, check_out::text as check_out,
                   overtime_minutes, notes`,
        [
          parseInt(employee_id),
          date,
          status,
          check_in || null,
          check_out || null,
          parseInt(overtime_minutes) || 0,
          notes || null,
          createdBy,
        ]
      );
      saved.push(result.rows[0]);
    }

    res.status(201).json({ message: `${saved.length} attendance records saved`, saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/attendance/monthly-report?employee_id=&month=&year=
const getMonthlyReport = async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'month and year are required' });

    const params = [parseInt(month), parseInt(year)];
    let idx = 3;
    let extra = '';
    if (employee_id) {
      extra = ` AND a.employee_id = $${idx++}`;
      params.push(parseInt(employee_id));
    }

    const result = await db.query(
      `SELECT a.id, a.employee_id, a.date::text as date, a.status,
              a.check_in::text as check_in, a.check_out::text as check_out,
              a.overtime_minutes, a.notes,
              s.name as employee_name, s.role, s.shift, s.salary
       FROM Attendance a
       JOIN Staff s ON a.employee_id = s.id
       WHERE EXTRACT(MONTH FROM a.date) = $1
         AND EXTRACT(YEAR FROM a.date) = $2
         ${extra}
       ORDER BY s.name ASC, a.date ASC`,
      params
    );

    const summaryMap = {};
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();

    for (const row of result.rows) {
      if (!summaryMap[row.employee_id]) {
        summaryMap[row.employee_id] = {
          employee_id: row.employee_id,
          employee_name: row.employee_name,
          role: row.role,
          shift: row.shift,
          salary: row.salary,
          present: 0, absent: 0, half_day: 0, leave: 0, holiday: 0,
          late_days: 0, total_overtime_minutes: 0,
          records: [],
        };
      }
      const s = summaryMap[row.employee_id];
      s.records.push(row);
      if (row.status === 'present')       s.present++;
      else if (row.status === 'absent')   s.absent++;
      else if (row.status === 'half_day') s.half_day++;
      else if (row.status === 'leave')    s.leave++;
      else if (row.status === 'holiday')  s.holiday++;
      if (row.overtime_minutes > 0) s.total_overtime_minutes += parseInt(row.overtime_minutes);
      if (row.check_in && row.check_in > '09:00') s.late_days++;
    }

    const summaries = Object.values(summaryMap).map((s) => {
      const working_days = daysInMonth - s.holiday;
      const attended = s.present + s.half_day * 0.5;
      const attendance_pct = working_days > 0 ? Math.round((attended / working_days) * 100) : 0;
      return { ...s, working_days, attendance_pct, days_in_month: daysInMonth };
    });

    res.json({ summaries, month: parseInt(month), year: parseInt(year), days_in_month: daysInMonth });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/attendance/:id
const deleteAttendance = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM Attendance WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/attendance/stats/today — dashboard widget
const getTodayStats = async (req, res) => {
  try {
    // Use AT TIME ZONE to get the server's local date reliably
    const todayResult = await db.query(`SELECT CURRENT_DATE::text as today`);
    const today = todayResult.rows[0].today;

    const result = await db.query(
      `SELECT
         COUNT(CASE WHEN status = 'present'  THEN 1 END) as present,
         COUNT(CASE WHEN status = 'absent'   THEN 1 END) as absent,
         COUNT(CASE WHEN status = 'leave'    THEN 1 END) as on_leave,
         COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_day
       FROM Attendance
       WHERE date = $1::date`,
      [today]
    );
    const staffCount = await db.query('SELECT COUNT(*) FROM Staff');
    res.json({
      ...result.rows[0],
      total_staff: parseInt(staffCount.rows[0].count),
      date: today,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAttendance,
  getDailyAttendance,
  upsertAttendance,
  bulkUpsertAttendance,
  getMonthlyReport,
  deleteAttendance,
  getTodayStats,
};
