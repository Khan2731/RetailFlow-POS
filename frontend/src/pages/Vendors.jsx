import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, TextField, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tooltip, Card, CardContent, Grid, Divider, Tabs, Tab,
} from '@mui/material';
import {
  Add, Edit, Delete, Storefront, Payments, ShoppingCart,
  FileDownload, Close, Visibility,
} from '@mui/icons-material';
import { vendorAPI, inventoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLOR = { active: 'success', inactive: 'default' };
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'easypaisa', 'jazzcash'];
const PAYMENT_TERMS = ['immediate', '7 days', '15 days', '30 days', '60 days'];

const defaultForm = {
  company_name: '', contact_person: '', phone: '', whatsapp: '', email: '',
  address: '', city: '', country: 'Pakistan', tax_number: '',
  opening_balance: '', credit_limit: '', payment_terms: 'immediate',
  notes: '', status: 'active',
};

const SummaryCard = ({ title, value, color }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
    <CardContent sx={{ py: 2 }}>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value}</Typography>
    </CardContent>
  </Card>
);

const Vendors = () => {
  const { isAdmin } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [profileDialog, setProfileDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [profileTab, setProfileTab] = useState(0);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [vendorPurchases, setVendorPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ payment_date: new Date().toISOString().split('T')[0], amount: '', payment_method: 'cash', reference_number: '', notes: '' });
  const [purchaseForm, setPurchaseForm] = useState({ inventory_item_id: '', item_name: '', purchase_date: new Date().toISOString().split('T')[0], quantity: '', unit: '', unit_price: '', notes: '' });
  const [payDialog, setPayDialog] = useState(false);
  const [purchaseDialog, setPurchaseDialog] = useState(false);

  const fetchStats = useCallback(async () => {
    try { const r = await vendorAPI.getStats(); setStats(r.data || {}); } catch { /* ignore */ }
  }, []);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      params.limit = 100;
      const r = await vendorAPI.getAll(params);
      setVendors(r.data.data || []);
      setTotal(r.data.total || 0);
    } catch { toast.error('Failed to load vendors'); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  useEffect(() => { inventoryAPI.getAll().then(r => setInventory(r.data || [])).catch(() => {}); }, []);

  const openAdd = () => { setEditingId(null); setForm(defaultForm); setOpenDialog(true); };
  const openEdit = (v) => {
    setEditingId(v.id);
    setForm({ company_name: v.company_name, contact_person: v.contact_person || '', phone: v.phone || '', whatsapp: v.whatsapp || '', email: v.email || '', address: v.address || '', city: v.city || '', country: v.country || 'Pakistan', tax_number: v.tax_number || '', opening_balance: v.opening_balance || '', credit_limit: v.credit_limit || '', payment_terms: v.payment_terms || 'immediate', notes: v.notes || '', status: v.status || 'active' });
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim()) { toast.error('Company name is required'); return; }
    try {
      if (editingId) { await vendorAPI.update(editingId, form); toast.success('Vendor updated'); }
      else { await vendorAPI.create(form); toast.success('Vendor created'); }
      setOpenDialog(false); fetchVendors(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save vendor'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vendor?')) return;
    try { await vendorAPI.delete(id); toast.success('Vendor deleted'); fetchVendors(); fetchStats(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to delete vendor'); }
  };

  const openProfile = async (vendor) => {
    setSelectedVendor(vendor); setProfileTab(0); setProfileDialog(true);
    try {
      const [pays, purs] = await Promise.all([vendorAPI.getPayments(vendor.id), vendorAPI.getPurchases(vendor.id)]);
      setVendorPayments(pays.data || []); setVendorPurchases(purs.data || []);
    } catch { /* ignore */ }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await vendorAPI.createPayment(selectedVendor.id, paymentForm);
      toast.success('Payment recorded');
      setPayDialog(false);
      const [pays, v] = await Promise.all([vendorAPI.getPayments(selectedVendor.id), vendorAPI.getById(selectedVendor.id)]);
      setVendorPayments(pays.data || []); setSelectedVendor(v.data);
      fetchVendors(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to record payment'); }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseForm.item_name || !purchaseForm.quantity || !purchaseForm.unit_price) { toast.error('Item, quantity and price are required'); return; }
    try {
      await vendorAPI.createPurchase(selectedVendor.id, purchaseForm);
      toast.success('Purchase recorded');
      setPurchaseDialog(false);
      const [purs, v] = await Promise.all([vendorAPI.getPurchases(selectedVendor.id), vendorAPI.getById(selectedVendor.id)]);
      setVendorPurchases(purs.data || []); setSelectedVendor(v.data);
      fetchVendors(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to record purchase'); }
  };

  const exportCSV = () => {
    const headers = ['Vendor Code', 'Company', 'Contact', 'Phone', 'Email', 'City', 'Status', 'Total Purchases', 'Total Paid', 'Outstanding'];
    const rows = vendors.map(v => [v.vendor_code, v.company_name, v.contact_person || '', v.phone || '', v.email || '', v.city || '', v.status, Number(v.total_purchases || 0).toFixed(0), Number(v.total_paid || 0).toFixed(0), Number(v.outstanding_balance || 0).toFixed(0)]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'vendors.csv'; a.click();
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Storefront color="primary" />
          <Typography variant="h4">Vendor Management</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={exportCSV} size="small">Export</Button>
          {isAdmin() && <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Vendor</Button>}
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><SummaryCard title="Total Vendors" value={stats.total_vendors || 0} color="#1976d2" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Total Purchases" value={`Rs. ${Number(stats.total_purchases || 0).toFixed(0)}`} color="#e65100" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Total Paid" value={`Rs. ${Number(stats.total_paid || 0).toFixed(0)}`} color="#2e7d32" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Outstanding" value={`Rs. ${Number(stats.outstanding || 0).toFixed(0)}`} color="#c62828" /></Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField label="Search vendors" size="small" value={search} onChange={e => setSearch(e.target.value)} sx={{ flexGrow: 1, minWidth: 200 }} />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Chip label={`${total} vendors`} variant="outlined" size="small" />
      </Paper>

      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                {['Code', 'Company', 'Contact', 'Phone', 'City', 'Status', 'Purchases', 'Paid', 'Outstanding', 'Last Purchase', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>No vendors found. Add your first vendor.</TableCell></TableRow>
              ) : vendors.map(v => (
                <TableRow key={v.id} hover>
                  <TableCell><Chip label={v.vendor_code} size="small" variant="outlined" /></TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{v.company_name}</TableCell>
                  <TableCell>{v.contact_person || '—'}</TableCell>
                  <TableCell>{v.phone || '—'}</TableCell>
                  <TableCell>{v.city || '—'}</TableCell>
                  <TableCell><Chip label={v.status} color={STATUS_COLOR[v.status] || 'default'} size="small" /></TableCell>
                  <TableCell>Rs. {Number(v.total_purchases || 0).toFixed(0)}</TableCell>
                  <TableCell sx={{ color: '#2e7d32' }}>Rs. {Number(v.total_paid || 0).toFixed(0)}</TableCell>
                  <TableCell sx={{ color: Number(v.outstanding_balance) > 0 ? '#c62828' : '#2e7d32', fontWeight: 700 }}>Rs. {Number(v.outstanding_balance || 0).toFixed(0)}</TableCell>
                  <TableCell>{v.last_purchase_date || '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Profile"><IconButton size="small" color="primary" onClick={() => openProfile(v)}><Visibility fontSize="small" /></IconButton></Tooltip>
                    {isAdmin() && <><Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(v)}><Edit fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(v.id)}><Delete fontSize="small" /></IconButton></Tooltip></>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              {[['company_name','Company Name',true],['contact_person','Contact Person',false],['phone','Phone',false],['whatsapp','WhatsApp',false],['email','Email',false],['address','Address',false],['city','City',false],['country','Country',false],['tax_number','Tax Number',false]].map(([k,l,req]) => (
                <Grid item xs={12} sm={6} key={k}>
                  <TextField fullWidth margin="dense" label={l} required={req} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </Grid>
              ))}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth margin="dense" label="Opening Balance (Rs.)" type="number" value={form.opening_balance} onChange={e => setForm(f => ({ ...f, opening_balance: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth margin="dense" label="Credit Limit (Rs.)" type="number" value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Payment Terms</InputLabel>
                  <Select value={form.payment_terms} label="Payment Terms" onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))}>
                    {PAYMENT_TERMS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Status</InputLabel>
                  <Select value={form.status} label="Status" onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth margin="dense" label="Notes" multiline minRows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editingId ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Vendor Profile Dialog */}
      <Dialog open={profileDialog} onClose={() => setProfileDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedVendor?.company_name}</Typography>
              <Chip label={selectedVendor?.vendor_code} size="small" variant="outlined" sx={{ mr: 1 }} />
              <Chip label={selectedVendor?.status} color={STATUS_COLOR[selectedVendor?.status] || 'default'} size="small" />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isAdmin() && <><Button variant="outlined" size="small" startIcon={<Payments />} onClick={() => { setPaymentForm({ payment_date: new Date().toISOString().split('T')[0], amount: '', payment_method: 'cash', reference_number: '', notes: '' }); setPayDialog(true); }}>Add Payment</Button>
              <Button variant="outlined" size="small" startIcon={<ShoppingCart />} onClick={() => { setPurchaseForm({ inventory_item_id: '', item_name: '', purchase_date: new Date().toISOString().split('T')[0], quantity: '', unit: '', unit_price: '', notes: '' }); setPurchaseDialog(true); }}>Record Purchase</Button></>}
              <IconButton onClick={() => setProfileDialog(false)}><Close /></IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}><SummaryCard title="Total Purchases" value={`Rs. ${Number(selectedVendor?.total_purchases || 0).toFixed(0)}`} color="#e65100" /></Grid>
            <Grid item xs={6} sm={3}><SummaryCard title="Total Paid" value={`Rs. ${Number(selectedVendor?.total_paid || 0).toFixed(0)}`} color="#2e7d32" /></Grid>
            <Grid item xs={6} sm={3}><SummaryCard title="Outstanding" value={`Rs. ${Number(selectedVendor?.outstanding_balance || 0).toFixed(0)}`} color="#c62828" /></Grid>
            <Grid item xs={6} sm={3}><SummaryCard title="Credit Limit" value={`Rs. ${Number(selectedVendor?.credit_limit || 0).toFixed(0)}`} color="#1565c0" /></Grid>
          </Grid>
          <Tabs value={profileTab} onChange={(_, v) => setProfileTab(v)} sx={{ mb: 2 }}>
            <Tab label="Info" />
            <Tab label={`Purchases (${vendorPurchases.length})`} />
            <Tab label={`Payments (${vendorPayments.length})`} />
          </Tabs>
          {profileTab === 0 && (
            <Grid container spacing={2}>
              {[['Contact Person', selectedVendor?.contact_person],['Phone', selectedVendor?.phone],['WhatsApp', selectedVendor?.whatsapp],['Email', selectedVendor?.email],['Address', selectedVendor?.address],['City', selectedVendor?.city],['Country', selectedVendor?.country],['Tax Number', selectedVendor?.tax_number],['Payment Terms', selectedVendor?.payment_terms]].map(([l, v]) => (
                <Grid item xs={12} sm={6} key={l}><Typography variant="body2" color="text.secondary">{l}</Typography><Typography variant="body1" sx={{ fontWeight: 600 }}>{v || '—'}</Typography></Grid>
              ))}
              {selectedVendor?.notes && <Grid item xs={12}><Typography variant="body2" color="text.secondary">Notes</Typography><Typography variant="body1">{selectedVendor.notes}</Typography></Grid>}
            </Grid>
          )}
          {profileTab === 1 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor: '#f1f5f9' }}>{['Date','Item','Qty','Unit','Unit Price','Total','Notes'].map(h => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {vendorPurchases.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>No purchases recorded.</TableCell></TableRow>
                  : vendorPurchases.map(p => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.purchase_date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.item_name}</TableCell>
                      <TableCell>{Number(p.quantity).toFixed(2)}</TableCell>
                      <TableCell>{p.unit || '—'}</TableCell>
                      <TableCell>Rs. {Number(p.unit_price).toFixed(0)}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Rs. {Number(p.total_amount).toFixed(0)}</TableCell>
                      <TableCell>{p.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {profileTab === 2 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor: '#f1f5f9' }}>{['Date','Amount','Method','Reference','Notes'].map(h => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {vendorPayments.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No payments recorded.</TableCell></TableRow>
                  : vendorPayments.map(p => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.payment_date}</TableCell>
                      <TableCell sx={{ color: '#2e7d32', fontWeight: 700 }}>Rs. {Number(p.amount).toFixed(0)}</TableCell>
                      <TableCell>{p.payment_method?.replace('_',' ')}</TableCell>
                      <TableCell>{p.reference_number || '—'}</TableCell>
                      <TableCell>{p.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payDialog} onClose={() => setPayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment — {selectedVendor?.company_name}</DialogTitle>
        <form onSubmit={handlePayment}>
          <DialogContent>
            <TextField margin="dense" label="Payment Date" type="date" fullWidth required value={paymentForm.payment_date} onChange={e => setPaymentForm(f => ({ ...f, payment_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField margin="dense" label="Amount (Rs.)" type="number" fullWidth required value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} inputProps={{ min: 1, step: 0.01 }} />
            <FormControl fullWidth margin="dense">
              <InputLabel>Payment Method</InputLabel>
              <Select value={paymentForm.payment_method} label="Payment Method" onChange={e => setPaymentForm(f => ({ ...f, payment_method: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <MenuItem key={m} value={m}>{m.replace('_',' ')}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField margin="dense" label="Reference Number" fullWidth value={paymentForm.reference_number} onChange={e => setPaymentForm(f => ({ ...f, reference_number: e.target.value }))} />
            <TextField margin="dense" label="Notes" fullWidth multiline minRows={2} value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPayDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success">Record Payment</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialog} onClose={() => setPurchaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Purchase — {selectedVendor?.company_name}</DialogTitle>
        <form onSubmit={handlePurchase}>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>Link to Inventory Item (optional)</InputLabel>
              <Select value={purchaseForm.inventory_item_id} label="Link to Inventory Item (optional)"
                onChange={e => {
                  const item = inventory.find(i => i.id === e.target.value);
                  setPurchaseForm(f => ({ ...f, inventory_item_id: e.target.value, item_name: item?.item_name || f.item_name, unit: item?.unit || f.unit }));
                }}>
                <MenuItem value="">None</MenuItem>
                {inventory.map(i => <MenuItem key={i.id} value={i.id}>{i.item_name} ({i.unit})</MenuItem>)}
              </Select>
            </FormControl>
            <TextField margin="dense" label="Item Name" fullWidth required value={purchaseForm.item_name} onChange={e => setPurchaseForm(f => ({ ...f, item_name: e.target.value }))} />
            <TextField margin="dense" label="Purchase Date" type="date" fullWidth required value={purchaseForm.purchase_date} onChange={e => setPurchaseForm(f => ({ ...f, purchase_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <Grid container spacing={1}>
              <Grid item xs={6}><TextField margin="dense" label="Quantity" type="number" fullWidth required value={purchaseForm.quantity} onChange={e => setPurchaseForm(f => ({ ...f, quantity: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} /></Grid>
              <Grid item xs={6}><TextField margin="dense" label="Unit" fullWidth value={purchaseForm.unit} onChange={e => setPurchaseForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg, litre, piece…" /></Grid>
            </Grid>
            <TextField margin="dense" label="Unit Price (Rs.)" type="number" fullWidth required value={purchaseForm.unit_price} onChange={e => setPurchaseForm(f => ({ ...f, unit_price: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} />
            {purchaseForm.quantity && purchaseForm.unit_price && (
              <Box sx={{ mt: 1, p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="body2">Total: <strong>Rs. {(parseFloat(purchaseForm.quantity || 0) * parseFloat(purchaseForm.unit_price || 0)).toFixed(0)}</strong></Typography>
              </Box>
            )}
            <TextField margin="dense" label="Notes" fullWidth multiline minRows={2} value={purchaseForm.notes} onChange={e => setPurchaseForm(f => ({ ...f, notes: e.target.value }))} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPurchaseDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Record Purchase</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Vendors;
