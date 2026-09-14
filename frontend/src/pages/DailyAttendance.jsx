import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, TextField, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip,
  IconButton, Tooltip,
} from '@mui/material';
import { Save, Refresh, EventNote } from '@mui/icons-material';
import { attendanceAPI, staffAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'success' },
  { value: 'absent', label: 'Absent', color: 'error' },
  { value: 'half_day', label: 'Half Day', color: 'warning' },
  { value: 'leave', label: 'Leave', color: 'info' },
  { value: 'holiday', label: 'Holiday', color: 'default' },
];

const statusColor = (s) => STATUS_OPTIONS.find((o) => o.value === s)?.color || 'default';

const todayStr = () => new Date().toISOString().split('T')[0];

const DailyAttendance = () => {
  const { isAdmin } = useAuth();
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchDailyAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getDaily(date);
      const data = res.data || [];
      // Set default status for employees without a record
      setRows(
        data.map((emp) => ({
          employee_id: emp.employee_id,
          employee_name: emp.employee_name,
          role: emp.role,
          shift: emp.shift,
          attendance_id: emp.attendance_id || null,
          status: emp.status || 'present',
          // trim seconds from HH:MM:SS to HH:MM for <input type="time">
          check_in: (emp.check_in || '').substring(0, 5),
          check_out: (emp.check_out || '').substring(0, 5),
          overtime_minutes: emp.overtime_minutes || 0,
          notes: emp.notes || '',
          dirty: false,
        }))
      );
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchDailyAttendance(); }, [fetchDailyAttendance]);

  const updateRow = (idx, field, value) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, [field]: value, dirty: true } : r
      )
    );
  };

  const saveAll = async () => {
    if (!isAdmin()) { toast.error('Only admins can save attendance'); return; }
    setSaving(true);
    try {
      const records = rows.map((r) => ({
        employee_id: r.employee_id,
        date,
        status: r.status,
        check_in: r.status === 'present' || r.status === 'half_day' ? r.check_in || null : null,
        check_out: r.status === 'present' || r.status === 'half_day' ? r.check_out || null : null,
        overtime_minutes: r.overtime_minutes || 0,
        notes: r.notes || '',
      }));
      await attendanceAPI.bulkUpsert(records);
      toast.success('Attendance saved successfully');
      setRows((prev) => prev.map((r) => ({ ...r, dirty: false })));
      fetchDailyAttendance();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = rows.filter((r) => r.status === 'present').length;
  const absentCount = rows.filter((r) => r.status === 'absent').length;
  const leaveCount = rows.filter((r) => r.status === 'leave' || r.status === 'half_day').length;

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventNote color="primary" />
          <Typography variant="h4">Daily Attendance</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            label="Date"
            sx={{ minWidth: 160 }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={fetchDailyAttendance}><Refresh /></IconButton>
          </Tooltip>
          {isAdmin() && (
            <Button variant="contained" startIcon={<Save />} onClick={saveAll} disabled={saving}>
              {saving ? 'Saving…' : 'Save Attendance'}
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 1 }}>
            {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
          <Chip label={`${rows.length} Employees`} variant="outlined" size="small" />
          <Chip label={`Present: ${presentCount}`} color="success" variant="outlined" size="small" />
          <Chip label={`Absent: ${absentCount}`} color="error" variant="outlined" size="small" />
          <Chip label={`Leave/Half: ${leaveCount}`} color="warning" variant="outlined" size="small" />
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Shift</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Overtime (min)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => {
                  const showTimes = row.status === 'present' || row.status === 'half_day';
                  return (
                    <TableRow key={row.employee_id} sx={{ bgcolor: row.dirty ? '#fff8e1' : 'inherit' }}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.employee_name}</TableCell>
                      <TableCell>
                        <Chip label={row.role} size="small" />
                      </TableCell>
                      <TableCell>{row.shift}</TableCell>
                      <TableCell>
                        {isAdmin() ? (
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={row.status}
                              onChange={(e) => updateRow(idx, 'status', e.target.value)}
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip label={row.status.replace('_', ' ')} color={statusColor(row.status)} size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin() && showTimes ? (
                          <TextField
                            type="time"
                            size="small"
                            value={row.check_in}
                            onChange={(e) => updateRow(idx, 'check_in', e.target.value)}
                            sx={{ width: 120 }}
                            inputProps={{ step: 60 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">{row.check_in || '—'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin() && showTimes ? (
                          <TextField
                            type="time"
                            size="small"
                            value={row.check_out}
                            onChange={(e) => updateRow(idx, 'check_out', e.target.value)}
                            sx={{ width: 120 }}
                            inputProps={{ step: 60 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">{row.check_out || '—'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin() ? (
                          <TextField
                            type="number"
                            size="small"
                            value={row.overtime_minutes}
                            onChange={(e) => updateRow(idx, 'overtime_minutes', parseInt(e.target.value) || 0)}
                            sx={{ width: 90 }}
                            inputProps={{ min: 0 }}
                          />
                        ) : (
                          <Typography variant="body2">{row.overtime_minutes || 0}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin() ? (
                          <TextField
                            size="small"
                            value={row.notes}
                            onChange={(e) => updateRow(idx, 'notes', e.target.value)}
                            placeholder="Optional notes…"
                            sx={{ width: 180 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">{row.notes || '—'}</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default DailyAttendance;
