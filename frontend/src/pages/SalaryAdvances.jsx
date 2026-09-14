import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, TextField, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  TablePagination, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, MonetizationOn, Payments } from '@mui/icons-material';
import { salaryAdvanceAPI, staffAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MONTHS = [
  { v: '1', l: 'January' }, { v: '2', l: 'February' }, { v: '3', l: 'March' },
  { v: '4', l: 'April' }, { v: '5', l: 'May' }, { v: '6', l: 'June' },
  { v: '7', l: 'July' }, { v: '8', l: 'August' }, { v: '9', l: 'September' },
  { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' },
];
const REASONS = ['Medical', 'Personal', 'Emergency', 'Festival', 'Loan', 'Other'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'easypaisa', 'jazzcash'];
const STATUS_COLORS = {
  pending: 'warning', partially_recovered: 'info', fully_recovered: 'success',
};
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const defaultForm = {
  employee_id: '', amount: '', advance_date: new Date().toISOString().split('T')[0],
  reason: '', payment_method: 'cash', notes: '',
};

const SalaryAdvances = () => {
  const { isAdmin } = useAuth();
  const [advances, setAdvances] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const now = new Date();
  const [filters, setFilters] = useState({ employee_id: '', month: '', year: String(now.getFullYear()), status: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [recoverDialog, setRecoverDialog] = useState(false);
  const [recoverTarget, setRecoverTarget] = useState(null);
  const [recoverAmount, setRecoverAmount] = useState('');

  const fetchStaff = async () => {
    try { const r = await staffAPI.getAll(); setStaff(r.data || []); } catch { /* ignore */ }
  };

  const fetchAdvances = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.status) params.status = filters.status;
      const res = await salaryAdvanceAPI.getAll(params);
      setAdvances(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load advances'); } finally { setLoading(false); }
  }, [filters, page, rowsPerPage]);

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => { fetchAdvances(); }, [fetchAdvances]);

  const openAdd = () => { setEditingId(null); setForm(defaultForm); setOpenDialog(true); };
  const openEdit = (adv) => {
    setEditingId(adv.id);
    setForm({
      employee_id: adv.employee_id,
      amount: adv.amount,
      advance_date: adv.advance_date ? String(adv.advance_date).substring(0, 10) : '',
      reason: adv.reason || '',
      payment_method: adv.payment_method || 'cash',
      notes: adv.notes || '',
    });
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id) { toast.error('Employee is required'); return; }
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { toast.error('Amount must be greater than zero'); return; }
    if (!form.advance_date) { toast.error('Date is required'); return; }
    try {
      if (editingId) {
        await salaryAdvanceAPI.update(editingId, form);
        toast.success('Advance updated');
      } else {
        await salaryAdvanceAPI.create(form);
        toast.success('Advance created');
      }
      setOpenDialog(false);
      fetchAdvances();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save advance'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this advance?')) return;
    try { await salaryAdvanceAPI.delete(id); toast.success('Deleted'); fetchAdvances(); }
    catch { toast.error('Failed to delete'); }
  };

  const openRecover = (adv) => { setRecoverTarget(adv); setRecoverAmount(''); setRecoverDialog(true); };
  const handleRecover = async () => {
    const amt = parseFloat(recoverAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await salaryAdvanceAPI.recover(recoverTarget.id, amt);
      toast.success('Recovery recorded');
      setRecoverDialog(false);
      fetchAdvances();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to record recovery'); }
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MonetizationOn color="primary" />
          <Typography variant="h4">Salary Advances</Typography>
        </Box>
        {isAdmin() && (
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>New Advance</Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Employee</InputLabel>
          <Select value={filters.employee_id} label="Employee" onChange={(e) => { setFilters((f) => ({ ...f, employee_id: e.target.value })); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Month</InputLabel>
          <Select value={filters.month} label="Month" onChange={(e) => { setFilters((f) => ({ ...f, month: e.target.value })); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            {MONTHS.map((m) => <MenuItem key={m.v} value={m.v}>{m.l}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select value={filters.year} label="Year" onChange={(e) => { setFilters((f) => ({ ...f, year: e.target.value })); setPage(0); }}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filters.status} label="Status" onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="partially_recovered">Partially Recovered</MenuItem>
            <MenuItem value="fully_recovered">Fully Recovered</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Chip label={`${total} advances`} variant="outlined" size="small" />
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Recovered</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remaining</TableCell>
                  {isAdmin() && <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {advances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No advances found.</TableCell>
                  </TableRow>
                ) : (
                  advances.map((adv) => (
                    <TableRow key={adv.id} hover>
                      <TableCell>{adv.advance_date ? String(adv.advance_date).substring(0, 10) : '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{adv.employee_name}</TableCell>
                      <TableCell>Rs. {Number(adv.amount).toFixed(0)}</TableCell>
                      <TableCell>{adv.reason || '—'}</TableCell>
                      <TableCell>{adv.payment_method?.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Chip label={adv.status.replace(/_/g, ' ')} color={STATUS_COLORS[adv.status] || 'default'} size="small" />
                      </TableCell>
                      <TableCell sx={{ color: '#2e7d32', fontWeight: 600 }}>Rs. {Number(adv.recovered_amount).toFixed(0)}</TableCell>
                      <TableCell sx={{ color: Number(adv.remaining_amount) > 0 ? '#c62828' : '#2e7d32', fontWeight: 600 }}>
                        Rs. {Number(adv.remaining_amount).toFixed(0)}
                      </TableCell>
                      {isAdmin() && (
                        <TableCell align="right">
                          {Number(adv.remaining_amount) > 0 && (
                            <Tooltip title="Record Recovery">
                              <IconButton size="small" color="success" onClick={() => openRecover(adv)}>
                                <Payments fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(adv)}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(adv.id)}><Delete fontSize="small" /></IconButton>
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
            component="div" count={total} page={page} rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Advance' : 'New Salary Advance'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Employee</InputLabel>
              <Select value={form.employee_id} label="Employee" onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}>
                {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.name} ({s.role})</MenuItem>)}
              </Select>
            </FormControl>
            <TextField margin="dense" label="Amount (Rs.)" type="number" fullWidth required
              value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              inputProps={{ min: 1, step: 1 }} />
            <TextField margin="dense" label="Advance Date" type="date" fullWidth required
              value={form.advance_date} onChange={(e) => setForm((f) => ({ ...f, advance_date: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth margin="dense">
              <InputLabel>Reason</InputLabel>
              <Select value={form.reason} label="Reason" onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}>
                {REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Payment Method</InputLabel>
              <Select value={form.payment_method} label="Payment Method" onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}>
                {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField margin="dense" label="Notes" fullWidth multiline minRows={2}
              value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editingId ? 'Update' : 'Save'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Recover Dialog */}
      <Dialog open={recoverDialog} onClose={() => setRecoverDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Recovery</DialogTitle>
        <DialogContent>
          {recoverTarget && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">Employee: <strong>{recoverTarget.employee_name}</strong></Typography>
              <Typography variant="body2">Total Advance: <strong>Rs. {Number(recoverTarget.amount).toFixed(0)}</strong></Typography>
              <Typography variant="body2">Already Recovered: <strong>Rs. {Number(recoverTarget.recovered_amount).toFixed(0)}</strong></Typography>
              <Typography variant="body2" color="error">Remaining: <strong>Rs. {Number(recoverTarget.remaining_amount).toFixed(0)}</strong></Typography>
            </Box>
          )}
          <TextField
            autoFocus label="Recovery Amount (Rs.)" type="number" fullWidth
            value={recoverAmount} onChange={(e) => setRecoverAmount(e.target.value)}
            inputProps={{ min: 1, max: recoverTarget?.remaining_amount, step: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecoverDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleRecover}>Record Recovery</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SalaryAdvances;
