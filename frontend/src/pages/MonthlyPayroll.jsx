import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Tooltip, Alert, Divider, Radio, RadioGroup,
  FormControlLabel, FormLabel,
} from '@mui/material';
import { Edit, Delete, CheckCircle, AutoAwesome, Print, Payments, MonetizationOn } from '@mui/icons-material';
import { payrollAPI, staffAPI, salaryAdvanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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

const MonthlyPayroll = () => {
  const { isAdmin } = useAuth();
  const now = new Date();
  const [filters, setFilters] = useState({ month: String(now.getMonth() + 1), year: String(now.getFullYear()), employee_id: '', status: '' });
  const [payroll, setPayroll] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [generateConfirm, setGenerateConfirm] = useState(false);
  const [skipped, setSkipped] = useState([]);

  // Advance integration
  const [advanceDialog, setAdvanceDialog] = useState(false);
  const [advanceTarget, setAdvanceTarget] = useState(null);
  const [employeeAdvances, setEmployeeAdvances] = useState([]);
  const [advancesLoading, setAdvancesLoading] = useState(false);
  const [deductionMode, setDeductionMode] = useState('none'); // none | full | partial
  const [partialAmount, setPartialAmount] = useState('');

  const fetchStaff = async () => { try { const r = await staffAPI.getAll(); setStaff(r.data || []); } catch { /* ignore */ } };

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.status) params.status = filters.status;
      const res = await payrollAPI.getAll(params);
      setPayroll(res.data || []);
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  const handleGenerate = async (forceRegenerate = false) => {
    setGenerating(true);
    try {
      const res = await payrollAPI.generate({ month: parseInt(filters.month), year: parseInt(filters.year), force_regenerate: forceRegenerate });
      const { generated, skipped: sk } = res.data;
      if (generated.length > 0) toast.success(`Payroll generated for ${generated.length} employees`);
      if (sk?.length > 0) { setSkipped(sk); setGenerateConfirm(true); }
      fetchPayroll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to generate payroll'); }
    finally { setGenerating(false); }
  };

  const openEdit = (p) => {
    setEditTarget(p);
    setEditForm({ basic_salary: p.basic_salary, attendance_deduction: p.attendance_deduction, advance_deduction: p.advance_deduction, bonus: p.bonus, overtime_amount: p.overtime_amount, notes: p.notes || '' });
    setEditDialog(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try { await payrollAPI.update(editTarget.id, editForm); toast.success('Payroll updated'); setEditDialog(false); fetchPayroll(); }
    catch (err) { toast.error(err.response?.data?.error || 'Update failed'); }
  };

  const openAdvancePanel = async (p) => {
    setAdvanceTarget(p); setDeductionMode('none'); setPartialAmount('');
    setAdvanceDialog(true); setAdvancesLoading(true);
    try {
      const r = await salaryAdvanceAPI.getAll({ employee_id: p.employee_id, status: 'pending', limit: 100 });
      const partials = await salaryAdvanceAPI.getAll({ employee_id: p.employee_id, status: 'partially_recovered', limit: 100 });
      setEmployeeAdvances([...(r.data.data || []), ...(partials.data.data || [])]);
    } catch { toast.error('Failed to load advances'); }
    finally { setAdvancesLoading(false); }
  };

  const totalOutstanding = employeeAdvances.reduce((s, a) => s + Number(a.remaining_amount), 0);

  const applyAdvanceDeduction = async () => {
    let deductAmt = 0;
    if (deductionMode === 'full') deductAmt = totalOutstanding;
    else if (deductionMode === 'partial') {
      deductAmt = parseFloat(partialAmount);
      if (!deductAmt || deductAmt <= 0) { toast.error('Enter a valid partial amount'); return; }
      if (deductAmt > totalOutstanding) { toast.error(`Cannot exceed outstanding balance Rs. ${totalOutstanding.toFixed(0)}`); return; }
      const net = (parseFloat(advanceTarget.basic_salary) + parseFloat(advanceTarget.bonus || 0) + parseFloat(advanceTarget.overtime_amount || 0)) - parseFloat(advanceTarget.attendance_deduction || 0);
      if (deductAmt > net) { toast.error(`Cannot exceed net payable salary Rs. ${net.toFixed(0)}`); return; }
    } else {
      toast.info('No deduction applied. Advance remains pending.'); setAdvanceDialog(false); return;
    }
    try {
      await payrollAPI.update(advanceTarget.id, { basic_salary: advanceTarget.basic_salary, attendance_deduction: advanceTarget.attendance_deduction, advance_deduction: deductAmt, bonus: advanceTarget.bonus, overtime_amount: advanceTarget.overtime_amount, notes: advanceTarget.notes });
      toast.success(`Advance deduction of Rs. ${deductAmt.toFixed(0)} applied`);
      setAdvanceDialog(false); fetchPayroll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to apply deduction'); }
  };

  const handleMarkPaid = async (id) => {
    try { await payrollAPI.markPaid(id, new Date().toISOString().split('T')[0]); toast.success('Marked as paid — advances updated automatically'); fetchPayroll(); }
    catch { toast.error('Failed to mark as paid'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payroll record?')) return;
    try { await payrollAPI.delete(id); toast.success('Deleted'); fetchPayroll(); }
    catch { toast.error('Failed to delete'); }
  };

  const printPayslip = (p) => {
    const w = window.open('', '_blank', 'width=600,height=700');
    const monthLabel = MONTHS.find(m => m.v === String(p.month))?.l || p.month;
    w.document.write(`<html><head><title>Payslip</title><style>body{font-family:sans-serif;padding:24px;max-width:500px;margin:auto}h2{text-align:center;color:#1976d2}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}.total{font-weight:bold;font-size:1.1em;color:#1976d2}</style></head><body>
      <h2>🍕 PizzaHub — Payslip</h2><p style="text-align:center">${monthLabel} ${p.year}</p>
      <div class="row"><span>Employee</span><span>${p.employee_name}</span></div>
      <div class="row"><span>Role</span><span>${p.role}</span></div>
      <div class="row"><span>Basic Salary</span><span>Rs. ${Number(p.basic_salary).toFixed(0)}</span></div>
      <div class="row"><span>Bonus</span><span>Rs. ${Number(p.bonus).toFixed(0)}</span></div>
      <div class="row"><span>Overtime</span><span>Rs. ${Number(p.overtime_amount).toFixed(0)}</span></div>
      <div class="row"><span>Gross Salary</span><span>Rs. ${Number(p.gross_salary).toFixed(0)}</span></div>
      <div class="row"><span>Attendance Deduction</span><span>-Rs. ${Number(p.attendance_deduction).toFixed(0)}</span></div>
      <div class="row"><span>Salary Advance Deduction</span><span>-Rs. ${Number(p.advance_deduction).toFixed(0)}</span></div>
      <div class="row total"><span>NET SALARY</span><span>Rs. ${Number(p.net_salary).toFixed(0)}</span></div>
      <div class="row"><span>Status</span><span>${p.payment_status}</span></div>
      ${p.paid_date ? `<div class="row"><span>Paid On</span><span>${p.paid_date}</span></div>` : ''}
      </body></html>`);
    w.document.close(); w.print(); setTimeout(() => w.close(), 1000);
  };

  const totalNet = payroll.reduce((s, p) => s + Number(p.net_salary), 0);
  const pendingCount = payroll.filter(p => p.payment_status === 'pending').length;

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Payments color="primary" />
          <Typography variant="h4">Monthly Payroll</Typography>
        </Box>
        {isAdmin() && (
          <Button variant="contained" startIcon={<AutoAwesome />} onClick={() => handleGenerate(false)} disabled={generating}>
            {generating ? 'Generating…' : 'Generate Payroll'}
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Month</InputLabel>
          <Select value={filters.month} label="Month" onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}>
            {MONTHS.map(m => <MenuItem key={m.v} value={m.v}>{m.l}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select value={filters.year} label="Year" onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}>
            {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Employee</InputLabel>
          <Select value={filters.employee_id} label="Employee" onChange={e => setFilters(f => ({ ...f, employee_id: e.target.value }))}>
            <MenuItem value="">All</MenuItem>
            {staff.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filters.status} label="Status" onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`${payroll.length} records`} variant="outlined" size="small" />
          <Chip label={`${pendingCount} pending`} color="warning" variant="outlined" size="small" />
          <Chip label={`Total payable: Rs. ${totalNet.toFixed(0)}`} color="primary" variant="outlined" size="small" />
        </Box>
      </Paper>

      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                {['Employee', 'Basic Salary', 'Att. Deduction', 'Adv. Deduction', 'Bonus', 'Overtime', 'Gross', 'Net Salary', 'Status', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700 }} align={['Basic Salary','Att. Deduction','Adv. Deduction','Bonus','Overtime','Gross','Net Salary'].includes(h) ? 'right' : 'left'}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {payroll.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>No payroll records. Click "Generate Payroll" to calculate.</TableCell></TableRow>
              ) : payroll.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{p.employee_name}</TableCell>
                  <TableCell align="right">Rs. {Number(p.basic_salary).toFixed(0)}</TableCell>
                  <TableCell align="right" sx={{ color: '#c62828' }}>-Rs. {Number(p.attendance_deduction).toFixed(0)}</TableCell>
                  <TableCell align="right" sx={{ color: '#c62828' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      -Rs. {Number(p.advance_deduction).toFixed(0)}
                      {isAdmin() && p.payment_status === 'pending' && (
                        <Tooltip title="Manage Advance Deduction">
                          <IconButton size="small" color="warning" onClick={() => openAdvancePanel(p)} sx={{ p: 0.3 }}>
                            <MonetizationOn sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#2e7d32' }}>+Rs. {Number(p.bonus).toFixed(0)}</TableCell>
                  <TableCell align="right" sx={{ color: '#2e7d32' }}>+Rs. {Number(p.overtime_amount).toFixed(0)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Rs. {Number(p.gross_salary).toFixed(0)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '1rem' }}>Rs. {Number(p.net_salary).toFixed(0)}</TableCell>
                  <TableCell><Chip label={p.payment_status} color={STATUS_COLORS[p.payment_status] || 'default'} size="small" /></TableCell>
                  <TableCell align="right">
                    {isAdmin() && (<>
                      {p.payment_status === 'pending' && <Tooltip title="Mark Paid"><IconButton size="small" color="success" onClick={() => handleMarkPaid(p.id)}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
                      <Tooltip title="Print Payslip"><IconButton size="small" onClick={() => printPayslip(p)}><Print fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                    </>)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Regenerate Confirm */}
      <Dialog open={generateConfirm} onClose={() => setGenerateConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Existing Payroll Found</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>Payroll already exists for {skipped.length} employee(s): {skipped.map(s => s.name).join(', ')}</Alert>
          <Typography variant="body2">Regenerate and overwrite?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateConfirm(false)}>Keep Existing</Button>
          <Button variant="contained" color="warning" onClick={() => { setGenerateConfirm(false); handleGenerate(true); }}>Regenerate All</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Payroll — {editTarget?.employee_name}</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>Net = (Basic + Bonus + Overtime) − Attendance Deduction − Advance Deduction</Alert>
            {[['basic_salary','Basic Salary'],['attendance_deduction','Attendance Deduction'],['advance_deduction','Advance Deduction'],['bonus','Bonus'],['overtime_amount','Overtime Amount']].map(([k,l]) => (
              <TextField key={k} margin="dense" label={l} type="number" fullWidth value={editForm[k] ?? ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} />
            ))}
            <TextField margin="dense" label="Notes" fullWidth multiline minRows={2} value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
            <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
              <Typography variant="body2">Preview Net Salary: <strong>Rs. {Math.max(0, (parseFloat(editForm.basic_salary)||0)+(parseFloat(editForm.bonus)||0)+(parseFloat(editForm.overtime_amount)||0)-(parseFloat(editForm.attendance_deduction)||0)-(parseFloat(editForm.advance_deduction)||0)).toFixed(0)}</strong></Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Changes</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Advance Deduction Dialog */}
      <Dialog open={advanceDialog} onClose={() => setAdvanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MonetizationOn color="warning" />
            <span>Salary Advance Deduction — {advanceTarget?.employee_name}</span>
          </Box>
        </DialogTitle>
        <DialogContent>
          {advancesLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box> : (
            <>
              {/* Payroll Summary */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Payroll Summary</Typography>
                {[['Basic Salary', advanceTarget?.basic_salary, ''], ['Bonus', advanceTarget?.bonus, '+'], ['Overtime', advanceTarget?.overtime_amount, '+'], ['Attendance Deduction', advanceTarget?.attendance_deduction, '-'], ['Gross Salary', advanceTarget?.gross_salary, '']].map(([l, v, sign]) => (
                  <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="body2">{l}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{sign}Rs. {Number(v || 0).toFixed(0)}</Typography>
                  </Box>
                ))}
              </Paper>

              {/* Employee Advances */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Employee Salary Advances</Typography>
              {employeeAdvances.length === 0 ? (
                <Alert severity="success" sx={{ mb: 2 }}>No pending advances for this employee.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f1f5f9' }}>{['Date','Amount','Remaining','Reason','Status'].map(h => <TableCell key={h} sx={{ fontWeight: 700, py: 1 }}>{h}</TableCell>)}</TableRow></TableHead>
                    <TableBody>
                      {employeeAdvances.map(a => (
                        <TableRow key={a.id}>
                          <TableCell>{a.advance_date}</TableCell>
                          <TableCell>Rs. {Number(a.amount).toFixed(0)}</TableCell>
                          <TableCell sx={{ color: '#c62828', fontWeight: 700 }}>Rs. {Number(a.remaining_amount).toFixed(0)}</TableCell>
                          <TableCell>{a.reason || '—'}</TableCell>
                          <TableCell><Chip label={a.status.replace(/_/g,' ')} size="small" color="warning" /></TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: '#fff3e0' }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Total Outstanding</TableCell>
                        <TableCell colSpan={3} sx={{ color: '#c62828', fontWeight: 700 }}>Rs. {totalOutstanding.toFixed(0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Deduction Options */}
              <Divider sx={{ my: 2 }} />
              <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>Salary Advance Deduction Option</FormLabel>
              <RadioGroup value={deductionMode} onChange={e => { setDeductionMode(e.target.value); setPartialAmount(''); }}>
                <FormControlLabel value="none" control={<Radio />} label="Do Not Deduct — advance remains pending" />
                <FormControlLabel value="full" control={<Radio />} disabled={totalOutstanding <= 0} label={`Deduct Full Amount — Rs. ${totalOutstanding.toFixed(0)}`} />
                <FormControlLabel value="partial" control={<Radio />} disabled={totalOutstanding <= 0} label="Deduct Partial Amount" />
              </RadioGroup>
              {deductionMode === 'partial' && (
                <TextField sx={{ mt: 1 }} label="Partial Deduction Amount (Rs.)" type="number" fullWidth value={partialAmount}
                  onChange={e => setPartialAmount(e.target.value)}
                  inputProps={{ min: 1, max: totalOutstanding, step: 1 }}
                  helperText={`Max: Rs. ${totalOutstanding.toFixed(0)}`} />
              )}

              {/* Final Preview */}
              {deductionMode !== 'none' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                  <Typography variant="body2">
                    Advance Deduction: <strong>Rs. {deductionMode === 'full' ? totalOutstanding.toFixed(0) : (parseFloat(partialAmount) || 0).toFixed(0)}</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#1976d2' }}>
                    Final Net Salary: Rs. {Math.max(0, Number(advanceTarget?.gross_salary || 0) - Number(advanceTarget?.attendance_deduction || 0) - (deductionMode === 'full' ? totalOutstanding : parseFloat(partialAmount) || 0)).toFixed(0)}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdvanceDialog(false)}>Cancel</Button>
          <Button variant="contained" color={deductionMode === 'none' ? 'inherit' : 'primary'} onClick={applyAdvanceDeduction}>
            {deductionMode === 'none' ? 'Close (No Deduction)' : 'Apply Deduction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MonthlyPayroll;
