import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip,
  TextField, IconButton, Tooltip,
} from '@mui/material';
import { AccountBalanceWallet, FileDownload, Print } from '@mui/icons-material';
import { payrollAPI, staffAPI } from '../services/api';
import toast from 'react-hot-toast';

const MONTHS = [
  { v: '1', l: 'January' }, { v: '2', l: 'February' }, { v: '3', l: 'March' },
  { v: '4', l: 'April' }, { v: '5', l: 'May' }, { v: '6', l: 'June' },
  { v: '7', l: 'July' }, { v: '8', l: 'August' }, { v: '9', l: 'September' },
  { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' },
];
const STATUS_COLORS = { pending: 'warning', paid: 'success' };
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const SalaryHistory = () => {
  const now = new Date();
  const [filters, setFilters] = useState({ employee_id: '', year: String(now.getFullYear()), status: '' });
  const [payroll, setPayroll] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { staffAPI.getAll().then((r) => setStaff(r.data || [])).catch(() => {}); }, []);

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.year) params.year = filters.year;
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.status) params.status = filters.status;
      const res = await payrollAPI.getAll(params);
      setPayroll(res.data || []);
    } catch { toast.error('Failed to load salary history'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  const exportCSV = () => {
    const headers = ['Month', 'Year', 'Employee', 'Basic', 'Att.Deduction', 'Adv.Deduction', 'Bonus', 'Overtime', 'Gross', 'Net', 'Status', 'Paid Date'];
    const rows = payroll.map((p) => [
      MONTHS.find((m) => m.v === String(p.month))?.l || p.month,
      p.year, p.employee_name,
      p.basic_salary, p.attendance_deduction, p.advance_deduction,
      p.bonus, p.overtime_amount, p.gross_salary, p.net_salary,
      p.payment_status, p.paid_date || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `salary-history-${filters.year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceWallet color="primary" />
          <Typography variant="h4">Salary History</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={exportCSV} size="small">CSV</Button>
          <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} size="small">Print</Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Employee</InputLabel>
          <Select value={filters.employee_id} label="Employee" onChange={(e) => setFilters((f) => ({ ...f, employee_id: e.target.value }))}>
            <MenuItem value="">All</MenuItem>
            {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select value={filters.year} label="Year" onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filters.status} label="Status" onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Chip label={`${payroll.length} records`} variant="outlined" size="small" />
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Gross Salary</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Att. Deduction</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Adv. Deduction</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Bonus</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Overtime</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Net Salary</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Paid Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payroll.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>No salary history found.</TableCell>
                </TableRow>
              ) : (
                payroll.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{MONTHS.find((m) => m.v === String(p.month))?.l || p.month}</TableCell>
                    <TableCell>{p.year}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.employee_name}</TableCell>
                    <TableCell align="right">Rs. {Number(p.gross_salary).toFixed(0)}</TableCell>
                    <TableCell align="right" sx={{ color: '#c62828' }}>Rs. {Number(p.attendance_deduction).toFixed(0)}</TableCell>
                    <TableCell align="right" sx={{ color: '#c62828' }}>Rs. {Number(p.advance_deduction).toFixed(0)}</TableCell>
                    <TableCell align="right" sx={{ color: '#2e7d32' }}>Rs. {Number(p.bonus).toFixed(0)}</TableCell>
                    <TableCell align="right" sx={{ color: '#2e7d32' }}>Rs. {Number(p.overtime_amount).toFixed(0)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1976d2' }}>Rs. {Number(p.net_salary).toFixed(0)}</TableCell>
                    <TableCell><Chip label={p.payment_status} color={STATUS_COLORS[p.payment_status] || 'default'} size="small" /></TableCell>
                    <TableCell>{p.paid_date || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default SalaryHistory;
