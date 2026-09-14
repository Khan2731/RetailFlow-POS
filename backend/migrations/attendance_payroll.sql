-- Attendance table
CREATE TABLE IF NOT EXISTS Attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'absent',
    check_in TIME,
    check_out TIME,
    overtime_minutes INTEGER DEFAULT 0,
    notes TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT attendance_employee_date_unique UNIQUE (employee_id, date),
    FOREIGN KEY (employee_id) REFERENCES Staff(id) ON DELETE CASCADE
);

-- Salary Advances table
CREATE TABLE IF NOT EXISTS SalaryAdvances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    advance_date DATE NOT NULL,
    reason TEXT,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'pending',
    recovered_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (employee_id) REFERENCES Staff(id) ON DELETE CASCADE
);

-- Shift tracking table
CREATE TABLE IF NOT EXISTS Shifts (
    id SERIAL PRIMARY KEY,
    cashier_id INTEGER NOT NULL,
    business_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT now(),
    close_time TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'open',
    opening_cash NUMERIC(10, 2) DEFAULT 0,
    closing_cash NUMERIC(10, 2),
    expected_cash NUMERIC(10, 2),
    cash_difference NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (cashier_id) REFERENCES Staff(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shifts_cashier_id ON Shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_business_date ON Shifts(business_date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON Shifts(status);

-- Payroll table
CREATE TABLE IF NOT EXISTS Payroll (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    basic_salary NUMERIC(10, 2) NOT NULL DEFAULT 0,
    attendance_deduction NUMERIC(10, 2) NOT NULL DEFAULT 0,
    advance_deduction NUMERIC(10, 2) NOT NULL DEFAULT 0,
    bonus NUMERIC(10, 2) NOT NULL DEFAULT 0,
    overtime_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    gross_salary NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_salary NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    paid_date DATE,
    notes TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT payroll_employee_month_year_unique UNIQUE (employee_id, month, year),
    FOREIGN KEY (employee_id) REFERENCES Staff(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON Attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON Attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON Attendance(status);
CREATE INDEX IF NOT EXISTS idx_salary_advances_employee_id ON SalaryAdvances(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_advances_status ON SalaryAdvances(status);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON Payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month_year ON Payroll(month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON Payroll(payment_status);
