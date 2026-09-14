import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, TextField, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip,
  TablePagination, IconButton, Tooltip,
} from '@mui/material';
import { History, FileDownload, Print, Delete } from '@mui/icons-material';
import { attendanceAPI, staffAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const STATUS_COLORS = {
  present: 'success', absent: 'error', half_day: 'warning', leave: 'info', holiday: 'default',
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const AttendanceHistory = () => {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const now = new Date();
  const [filters, setFilters] = useState({
    employee_id: '',
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    status: '',
  });

  const fetchStaff = async () => {
    try {
      const res = await staffAPI.getAll();
      setStaff(res.data || []);
    } catch { /* ignore */ }
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.status) params.status = filters.status;

      const res = await attendanceAPI.getAll(params);
      setRecords(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  }, [filters, page, rowsPerPage]);

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await attendanceAPI.delete(id);
      toast.success('Record deleted');
      fetchHistory();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Employee', 'Role', 'Status', 'Check In', 'Check Out', 'Overtime (min)', 'Notes'];
    const rows = records.map((r) => [
      r.date, r.employee_name, r.role,
      r.status, r.check_in || '', r.check_out || '',
      r.overtime_minutes || 0, r.notes || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-history-${filters.month}-${filters.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History color="primary" />
          <Typography variant="h4">Attendance History</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={exportCSV} size="small">CSV</Button>
          <Button variant="outlined" startIcon={<Print />} onClick={handlePrint} size="small">Print</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Employee</InputLabel>
          <Select
            value={filters.employee_id}
            label="Employee"
            onChange={(e) => { setFilters((f) => ({ ...f, employee_id: e.target.value })); setPage(0); }}
          >
            <MenuItem value="">All Employees</MenuItem>
            {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Month</InputLabel>
          <Select value={filters.month} label="Month" onChange={(e) => { setFilters((f) => ({ ...f, month: e.target.value })); setPage(0); }}>
            <MenuItem value="">All Months</MenuItem>
            {MONTHS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select value={filters.year} label="Year" onChange={(e) => { setFilters((f) => ({ ...f, year: e.target.value })); setPage(0); }}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filters.status} label="Status" onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="half_day">Half Day</MenuItem>
            <MenuItem value="leave">Leave</MenuItem>
            <MenuItem value="holiday">Holiday</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Chip label={`${total} records`} variant="outlined" size="small" />
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Check In</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Check Out</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Overtime (min)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                  {isAdmin() && <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.employee_name}</TableCell>
                      <TableCell><Chip label={r.role} size="small" /></TableCell>
                      <TableCell>
                        <Chip
                          label={r.status.replace('_', ' ')}
                          color={STATUS_COLORS[r.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{r.check_in ? r.check_in.substring(0,5) : '—'}</TableCell>
                      <TableCell>{r.check_out ? r.check_out.substring(0,5) : '—'}</TableCell>
                      <TableCell>{r.overtime_minutes || 0}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.notes || '—'}</TableCell>
                      {isAdmin() && (
                        <TableCell align="right">
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>
      )}
    </Container>
  );
};

export default AttendanceHistory;
