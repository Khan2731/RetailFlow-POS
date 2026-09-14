import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Button, Paper, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip, Card, CardContent,
} from '@mui/material';
import { Assessment, FileDownload, Print } from '@mui/icons-material';
import { attendanceAPI, staffAPI } from '../services/api';
import toast from 'react-hot-toast';

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const STATUS_ABBR = {
  present: 'P', absent: 'A', half_day: 'H', leave: 'L', holiday: 'Ho', undefined: '—',
};
const STATUS_COLOR = {
  present: '#e8f5e9', absent: '#ffebee', half_day: '#fff8e1', leave: '#e3f2fd', holiday: '#f3e5f5',
};
const STATUS_TEXT_COLOR = {
  present: '#2e7d32', absent: '#c62828', half_day: '#f57f17', leave: '#1565c0', holiday: '#6a1b9a',
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const SummaryCard = ({ label, value, color }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
    <CardContent sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </CardContent>
  </Card>
);

const AttendanceReport = () => {
  const now = new Date();
  const [filters, setFilters] = useState({
    employee_id: '',
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  });
  const [report, setReport] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    staffAPI.getAll().then((r) => setStaff(r.data || [])).catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    if (!filters.month || !filters.year) return;
    setLoading(true);
    try {
      const params = { month: filters.month, year: filters.year };
      if (filters.employee_id) params.employee_id = filters.employee_id;
      const res = await attendanceAPI.getMonthlyReport(params);
      setReport(res.data);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportCSV = () => {
    if (!report) return;
    const headers = ['Employee', 'Role', 'Present', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Late', 'Overtime (min)', 'Attendance %'];
    const rows = report.summaries.map((s) => [
      s.employee_name, s.role, s.present, s.absent, s.half_day, s.leave, s.holiday, s.late_days, s.total_overtime_minutes, s.attendance_pct,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${filters.month}-${filters.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Aggregate totals across all summaries
  const totals = report?.summaries.reduce(
    (acc, s) => ({
      present: acc.present + s.present,
      absent: acc.absent + s.absent,
      half_day: acc.half_day + s.half_day,
      leave: acc.leave + s.leave,
      holiday: acc.holiday + s.holiday,
      late_days: acc.late_days + s.late_days,
    }),
    { present: 0, absent: 0, half_day: 0, leave: 0, holiday: 0, late_days: 0 }
  ) || {};

  const daysInMonth = report?.days_in_month || 30;
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" />
          <Typography variant="h4">Monthly Attendance Report</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={exportCSV} size="small">CSV</Button>
          <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} size="small">Print</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Employee</InputLabel>
          <Select value={filters.employee_id} label="Employee" onChange={(e) => setFilters((f) => ({ ...f, employee_id: e.target.value }))}>
            <MenuItem value="">All Employees</MenuItem>
            {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Month</InputLabel>
          <Select value={filters.month} label="Month" onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}>
            {MONTHS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select value={filters.year} label="Year" onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      {report && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}><SummaryCard label="Present" value={totals.present} color="#2e7d32" /></Grid>
          <Grid item xs={6} sm={4} md={2}><SummaryCard label="Absent" value={totals.absent} color="#c62828" /></Grid>
          <Grid item xs={6} sm={4} md={2}><SummaryCard label="Half Day" value={totals.half_day} color="#f57f17" /></Grid>
          <Grid item xs={6} sm={4} md={2}><SummaryCard label="Leave" value={totals.leave} color="#1565c0" /></Grid>
          <Grid item xs={6} sm={4} md={2}><SummaryCard label="Holiday" value={totals.holiday} color="#6a1b9a" /></Grid>
          <Grid item xs={6} sm={4} md={2}><SummaryCard label="Late Days" value={totals.late_days} color="#e65100" /></Grid>
        </Grid>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : !report ? null : (
        <>
          {/* Summary Table */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {MONTHS.find((m) => m.value === filters.month)?.label} {filters.year} — Employee Summary
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Present</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Absent</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Half Day</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Leave</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Holiday</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Late</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">OT (min)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Attendance %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.summaries.map((s) => (
                    <TableRow key={s.employee_id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{s.employee_name}</TableCell>
                      <TableCell><Chip label={s.role} size="small" /></TableCell>
                      <TableCell align="center"><Chip label={s.present} color="success" size="small" /></TableCell>
                      <TableCell align="center"><Chip label={s.absent} color="error" size="small" /></TableCell>
                      <TableCell align="center"><Chip label={s.half_day} color="warning" size="small" /></TableCell>
                      <TableCell align="center"><Chip label={s.leave} color="info" size="small" /></TableCell>
                      <TableCell align="center"><Chip label={s.holiday} size="small" /></TableCell>
                      <TableCell align="center">{s.late_days}</TableCell>
                      <TableCell align="center">{s.total_overtime_minutes}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${s.attendance_pct}%`}
                          color={s.attendance_pct >= 90 ? 'success' : s.attendance_pct >= 75 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {report.summaries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No attendance records for this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Calendar view per employee */}
          {report.summaries.map((s) => (
            <Paper key={s.employee_id} sx={{ mb: 2, p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                {s.employee_name} — {s.role}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {allDays.map((day) => {
                  const rec = s.records.find((r) => {
                    const d = new Date(r.date + 'T00:00:00');
                    return d.getDate() === day;
                  });
                  const status = rec?.status;
                  return (
                    <Box
                      key={day}
                      sx={{
                        width: 32, height: 32, borderRadius: 1, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                        bgcolor: STATUS_COLOR[status] || '#f5f5f5',
                        color: STATUS_TEXT_COLOR[status] || '#9e9e9e',
                        border: '1px solid rgba(0,0,0,0.08)',
                      }}
                      title={`Day ${day}: ${status || 'no record'}`}
                    >
                      {day}
                    </Box>
                  );
                })}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                {Object.entries(STATUS_ABBR).filter(([k]) => k !== 'undefined').map(([key, abbr]) => (
                  <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 11 }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: STATUS_COLOR[key] }} />
                    <Typography variant="caption">{abbr} = {key.replace('_', ' ')}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
        </>
      )}
    </Container>
  );
};

export default AttendanceReport;
