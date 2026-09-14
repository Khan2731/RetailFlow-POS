const db = require('../config/database');

// Helper: calculate attendance deduction for an employee in a given month/year
const calcAttendanceDeduction = async (employeeId, month, year, basicSalary) => {
  const daysInMonth = new Date(year, month, 0).getDate();

  const result = await db.query(
    `SELECT status FROM Attendance
     WHERE employee_id = $1
       AND EXTRACT(MONTH FROM date) = $2
       AND EXTRACT(YEAR FROM date) = $3`,
    [employeeId, parseInt(month), parseInt(year)]
  );

  const records = result.rows;
  let absentDays = 0;
  let halfDays = 0;

  for (const r of records) {
    if (r.status === 'absent') absentDays++;
    else if (r.status === 'half_day') halfDays++;
    // 'leave' and 'holiday' are paid — no deduction
  }

  const dailySalary = basicSalary / daysInMonth;
  const deduction = dailySalary * absentDays + (dailySalary / 2) * halfDays;
  return Math.round(deduction * 100) / 100;
};

// Helper: calculate overtime amount for an employee in a given month/year
const calcOvertimeAmount = async (employeeId, month, year, basicSalary) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result = await db.query(
    `SELECT COALESCE(SUM(overtime_minutes), 0) as total_minutes
     FROM Attendance
     WHERE employee_id = $1
       AND EXTRACT(MONTH FROM date) = $2
       AND EXTRACT(YEAR FROM date) = $3`,
    [employeeId, parseInt(month), parseInt(year)]
  );

  const totalMinutes = parseInt(result.rows[0].total_minutes) || 0;
  if (totalMinutes <= 0) return 0;

  // Hourly rate: monthly salary / (working days * 8 hours)
  const workingDays = daysInMonth;
  const hourlyRate = basicSalary / (workingDays * 8);
  const overtimeAmount = (totalMinutes / 60) * hourlyRate * 1.5; // 1.5x overtime rate
  return Math.round(overtimeAmount * 100) / 100;
};

// GET /api/payroll?month=&year=&employee_id=&status=
const getPayroll = async (req, res) => {
  try {
    const { month, year, employee_id, status } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (month) { conditions.push(`p.month = $${idx++}`); params.push(parseInt(month)); }
    if (year) { conditions.push(`p.year = $${idx++}`); params.push(parseInt(year)); }
    if (employee_id) { conditions.push(`p.employee_id = $${idx++}`); params.push(employee_id); }
    if (status) { conditions.push(`p.payment_status = $${idx++}`); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT p.*, s.name as employee_name, s.role, s.shift
       FROM Payroll p
       JOIN Staff s ON p.employee_id = s.id
       ${where}
       ORDER BY p.year DESC, p.month DESC, s.name ASC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/payroll/:id
const getPayrollById = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, s.name as employee_name, s.role, s.salary
       FROM Payroll p
       JOIN Staff s ON p.employee_id = s.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Payroll record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/payroll/generate  — auto-calculate for all staff or specific employee
const generatePayroll = async (req, res) => {
  try {
    const { month, year, employee_id, force_regenerate } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'month and year are required' });

    const createdBy = req.user?.id || null;

    // Fetch staff
    let staffQuery = 'SELECT id, name, salary FROM Staff';
    const staffParams = [];
    if (employee_id) {
      staffQuery += ' WHERE id = $1';
      staffParams.push(employee_id);
    }
    const staffResult = await db.query(staffQuery, staffParams);
    const staffList = staffResult.rows;

    const generated = [];
    const skipped = [];

    for (const emp of staffList) {
      // Check if payroll already exists
      const existing = await db.query(
        'SELECT id FROM Payroll WHERE employee_id = $1 AND month = $2 AND year = $3',
        [emp.id, month, year]
      );

      if (existing.rows.length && !force_regenerate) {
        skipped.push({ employee_id: emp.id, name: emp.name });
        continue;
      }

      const basicSalary = parseFloat(emp.salary) || 0;
      const attendanceDeduction = await calcAttendanceDeduction(emp.id, month, year, basicSalary);
      const overtimeAmount = await calcOvertimeAmount(emp.id, month, year, basicSalary);

      // Pending advance deduction — sum of outstanding advances for this payroll period
      const advResult = await db.query(
        `SELECT COALESCE(SUM(remaining_amount), 0) as total_remaining
         FROM SalaryAdvances
         WHERE employee_id = $1 AND status != 'fully_recovered' AND advance_date >= $2 AND advance_date <= $3`,
        [emp.id, `${year}-${String(month).padStart(2, '0')}-01`, `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`]
      );
      const totalAdvanceRemaining = parseFloat(advResult.rows[0].total_remaining) || 0;
      const advanceDeduction = Math.min(totalAdvanceRemaining, basicSalary);

      const grossSalary = basicSalary + overtimeAmount;
      const netSalary = Math.max(0, grossSalary - attendanceDeduction - advanceDeduction);

      if (existing.rows.length && force_regenerate) {
        // Update existing
        await db.query(
          `UPDATE Payroll SET
             basic_salary = $1, attendance_deduction = $2, advance_deduction = $3,
             bonus = 0, overtime_amount = $4, gross_salary = $5, net_salary = $6,
             payment_status = 'pending', paid_date = NULL, updated_by = $7, updated_at = now()
           WHERE employee_id = $8 AND month = $9 AND year = $10`,
          [basicSalary, attendanceDeduction, advanceDeduction, overtimeAmount, grossSalary, netSalary, createdBy, emp.id, month, year]
        );
        const updated = await db.query(
          'SELECT * FROM Payroll WHERE employee_id = $1 AND month = $2 AND year = $3',
          [emp.id, month, year]
        );
        generated.push({ ...updated.rows[0], employee_name: emp.name });
      } else {
        const result = await db.query(
          `INSERT INTO Payroll (employee_id, month, year, basic_salary, attendance_deduction, advance_deduction, bonus, overtime_amount, gross_salary, net_salary, payment_status, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, 'pending', $10, $10)
           RETURNING *`,
          [emp.id, month, year, basicSalary, attendanceDeduction, advanceDeduction, overtimeAmount, grossSalary, netSalary, createdBy]
        );
        generated.push({ ...result.rows[0], employee_name: emp.name });
      }
    }

    res.status(201).json({ message: `Payroll generated for ${generated.length} employees`, generated, skipped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/payroll/:id  — manual adjustment
const updatePayroll = async (req, res) => {
  try {
    const { basic_salary, attendance_deduction, advance_deduction, bonus, overtime_amount, notes } = req.body;
    const updatedBy = req.user?.id || null;

    const bs = parseFloat(basic_salary) || 0;
    const ad = parseFloat(attendance_deduction) || 0;
    const avd = parseFloat(advance_deduction) || 0;
    const bon = parseFloat(bonus) || 0;
    const ot = parseFloat(overtime_amount) || 0;
    const grossSalary = bs + bon + ot;
    const netSalary = Math.max(0, grossSalary - ad - avd);

    const result = await db.query(
      `UPDATE Payroll SET
         basic_salary = $1, attendance_deduction = $2, advance_deduction = $3,
         bonus = $4, overtime_amount = $5, gross_salary = $6, net_salary = $7,
         notes = $8, updated_by = $9, updated_at = now()
       WHERE id = $10 RETURNING *`,
      [bs, ad, avd, bon, ot, grossSalary, netSalary, notes || null, updatedBy, req.params.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Payroll record not found' });
    res.json({ message: 'Payroll updated successfully', payroll: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/payroll/:id/mark-paid
const markPaid = async (req, res) => {
  try {
    const { paid_date } = req.body;
    const updatedBy = req.user?.id || null;
    const paidOn = paid_date || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `UPDATE Payroll SET payment_status = 'paid', paid_date = $1, updated_by = $2, updated_at = now()
       WHERE id = $3 RETURNING *`,
      [paidOn, updatedBy, req.params.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Payroll record not found' });

    // Apply advance deduction to actual advance records
    const payroll = result.rows[0];
    if (parseFloat(payroll.advance_deduction) > 0) {
      const advances = await db.query(
        `SELECT * FROM SalaryAdvances
         WHERE employee_id = $1 AND status != 'fully_recovered'
         ORDER BY advance_date ASC`,
        [payroll.employee_id]
      );

      let remainingDeduction = parseFloat(payroll.advance_deduction);
      for (const adv of advances.rows) {
        if (remainingDeduction <= 0) break;
        const advRemaining = parseFloat(adv.remaining_amount);
        const deductNow = Math.min(remainingDeduction, advRemaining);
        const newRecovered = parseFloat(adv.recovered_amount) + deductNow;
        const newRemaining = advRemaining - deductNow;
        const newStatus = newRemaining <= 0 ? 'fully_recovered' : 'partially_recovered';

        await db.query(
          `UPDATE SalaryAdvances SET recovered_amount = $1, remaining_amount = $2, status = $3, updated_at = now()
           WHERE id = $4`,
          [newRecovered, Math.max(0, newRemaining), newStatus, adv.id]
        );
        remainingDeduction -= deductNow;
      }
    }

    res.json({ message: 'Payroll marked as paid', payroll: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/payroll/:id
const deletePayroll = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM Payroll WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Payroll record not found' });
    res.json({ message: 'Payroll record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/payroll/stats  — for dashboard
const getPayrollStats = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await db.query(
      `SELECT
         COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
         COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN net_salary ELSE 0 END), 0) as pending_amount,
         COUNT(*) as total_records
       FROM Payroll WHERE month = $1 AND year = $2`,
      [month, year]
    );

    res.json({ ...result.rows[0], month, year });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getPayroll,
  getPayrollById,
  generatePayroll,
  updatePayroll,
  markPaid,
  deletePayroll,
  getPayrollStats,
};
