import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, TextField, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tooltip, Card, CardContent, Grid, Alert, Tabs, Tab, Divider,
} from '@mui/material';
import {
  Add, Edit, Delete, Warning, TrendingUp, TrendingDown,
  SwapVert, DeleteSweep, Undo, FileDownload, Inventory2,
} from '@mui/icons-material';
import { inventoryAPI, inventoryMovementAPI, vendorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const UNITS = ['kg', 'gram', 'litre', 'ml', 'bottle', 'packet', 'piece', 'box', 'dozen'];
const CATEGORIES = ['Dough & Flour', 'Cheese', 'Sauce', 'Vegetables', 'Meat', 'Beverages', 'Packaging', 'Cleaning', 'Other'];
const MOVEMENT_TYPES = [
  { value: 'stock_in', label: 'Stock In', icon: <TrendingUp />, color: '#2e7d32' },
  { value: 'stock_out', label: 'Stock Out', icon: <TrendingDown />, color: '#c62828' },
  { value: 'adjustment', label: 'Adjustment', icon: <SwapVert />, color: '#1565c0' },
  { value: 'wastage', label: 'Wastage', icon: <DeleteSweep />, color: '#e65100' },
  { value: 'return', label: 'Return', icon: <Undo />, color: '#7b1fa2' },
];

const StatCard = ({ title, value, color, icon }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value}</Typography>
        </Box>
        <Box sx={{ color, opacity: 0.7, fontSize: 36 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const InventoryEnhanced = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [movements, setMovements] = useState([]);
  const [movTotal, setMovTotal] = useState(0);
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [movLoading, setMovLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [movTypeFilter, setMovTypeFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [movDialog, setMovDialog] = useState(false);
  const [movTarget, setMovTarget] = useState(null);
  const [form, setForm] = useState({ item_name: '', sku: '', category: '', quantity: '', unit: 'kg', minimum_quantity: '10', price: '', vendor_id: '', storage_location: '', status: 'active', notes: '' });
  const [movForm, setMovForm] = useState({ movement_type: 'stock_in', quantity: '', reason: '', reference: '', vendor_id: '', purchase_price: '', movement_date: new Date().toISOString().split('T')[0] });

  const fetchStats = useCallback(async () => {
    try { const r = await inventoryMovementAPI.getStats(); setStats(r.data || {}); } catch { /* ignore */ }
  }, []);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try { const r = await inventoryAPI.getAll(); setInventory(r.data || []); }
    catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, []);

  const fetchMovements = useCallback(async () => {
    setMovLoading(true);
    try {
      const params = { limit: 100 };
      if (movTypeFilter) params.movement_type = movTypeFilter;
      const r = await inventoryMovementAPI.getAll(params);
      setMovements(r.data.data || []);
      setMovTotal(r.data.total || 0);
    } catch { toast.error('Failed to load movements'); }
    finally { setMovLoading(false); }
  }, [movTypeFilter]);

  useEffect(() => { fetchStats(); fetchInventory(); vendorAPI.getAll({ limit: 100 }).then(r => setVendors(r.data.data || [])).catch(() => {}); }, []);
  useEffect(() => { if (tab === 1) fetchMovements(); }, [tab, fetchMovements]);

  useEffect(() => {
    let f = inventory;
    if (search) f = f.filter(i => i.item_name.toLowerCase().includes(search.toLowerCase()) || (i.sku || '').toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter) f = f.filter(i => i.category === categoryFilter);
    if (stockFilter === 'low') f = f.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.minimum_quantity || 10));
    if (stockFilter === 'out') f = f.filter(i => Number(i.quantity) === 0);
    if (stockFilter === 'ok') f = f.filter(i => Number(i.quantity) > Number(i.minimum_quantity || 10));
    setFiltered(f);
  }, [inventory, search, categoryFilter, stockFilter]);

  const openAdd = () => { setEditingItem(null); setForm({ item_name: '', sku: '', category: '', quantity: '', unit: 'kg', minimum_quantity: '10', price: '', vendor_id: '', storage_location: '', status: 'active', notes: '' }); setOpenDialog(true); };
  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ item_name: item.item_name, sku: item.sku || '', category: item.category || '', quantity: item.quantity, unit: item.unit, minimum_quantity: item.minimum_quantity || 10, price: item.price, vendor_id: item.vendor_id || '', storage_location: item.storage_location || '', status: item.status || 'active', notes: item.notes || '' });
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.unit) { toast.error('Item name and unit are required'); return; }
    try {
      const payload = { ...form, quantity: parseFloat(form.quantity) || 0, minimum_quantity: parseFloat(form.minimum_quantity) || 10, price: parseFloat(form.price) || 0, vendor_id: form.vendor_id || null };
      if (editingItem) { await inventoryAPI.update(editingItem.id, payload); toast.success('Item updated'); }
      else { await inventoryAPI.create(payload); toast.success('Item created'); }
      setOpenDialog(false); fetchInventory(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save item'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await inventoryAPI.delete(id); toast.success('Item deleted'); fetchInventory(); fetchStats(); }
    catch { toast.error('Failed to delete item'); }
  };

  const openMovement = (item) => {
    setMovTarget(item);
    setMovForm({ movement_type: 'stock_in', quantity: '', reason: '', reference: '', vendor_id: item.vendor_id || '', purchase_price: item.price || '', movement_date: new Date().toISOString().split('T')[0] });
    setMovDialog(true);
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    if (!movForm.quantity || parseFloat(movForm.quantity) <= 0) { toast.error('Enter a valid quantity'); return; }
    try {
      await inventoryMovementAPI.create({ inventory_item_id: movTarget.id, ...movForm, quantity: parseFloat(movForm.quantity) });
      toast.success('Stock movement recorded');
      setMovDialog(false); fetchInventory(); fetchMovements(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to record movement'); }
  };

  const lowStockCount = inventory.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.minimum_quantity || 10)).length;
  const outOfStockCount = inventory.filter(i => Number(i.quantity) === 0).length;

  const exportCSV = () => {
    const headers = ['Item', 'SKU', 'Category', 'Quantity', 'Unit', 'Min Qty', 'Price', 'Value', 'Location', 'Status'];
    const rows = filtered.map(i => [i.item_name, i.sku || '', i.category || '', i.quantity, i.unit, i.minimum_quantity || 10, i.price, (Number(i.quantity) * Number(i.price)).toFixed(0), i.storage_location || '', i.status || 'active']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'inventory.csv'; a.click();
  };

  const MOV_COLOR = { stock_in: '#2e7d32', stock_out: '#c62828', adjustment: '#1565c0', wastage: '#e65100', return: '#7b1fa2' };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory2 color="primary" />
          <Typography variant="h4">Inventory</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={exportCSV} size="small">Export</Button>
          {isAdmin() && <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Item</Button>}
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard title="Total Items" value={stats.total_items || inventory.length} color="#1976d2" icon={<Inventory2 />} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Inventory Value" value={`Rs. ${Number(stats.inventory_value || 0).toFixed(0)}`} color="#2e7d32" icon={<TrendingUp />} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Low Stock" value={stats.low_stock || lowStockCount} color="#e65100" icon={<Warning />} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Out of Stock" value={stats.out_of_stock || outOfStockCount} color="#c62828" icon={<DeleteSweep />} /></Grid>
      </Grid>

      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {outOfStockCount > 0 && <span><strong>{outOfStockCount}</strong> items out of stock. </span>}
          {lowStockCount > 0 && <span><strong>{lowStockCount}</strong> items running low.</span>}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Stock Items" />
        <Tab label="Stock Movements" />
      </Tabs>

      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField label="Search items" size="small" value={search} onChange={e => setSearch(e.target.value)} sx={{ flexGrow: 1, minWidth: 200 }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} label="Category" onChange={e => setCategoryFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Stock Status</InputLabel>
              <Select value={stockFilter} label="Stock Status" onChange={e => setStockFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ok">In Stock</MenuItem>
                <MenuItem value="low">Low Stock</MenuItem>
                <MenuItem value="out">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`${filtered.length} items`} variant="outlined" size="small" />
              <Chip label={`Rs. ${filtered.reduce((s, i) => s + Number(i.quantity) * Number(i.price || 0), 0).toFixed(0)} value`} color="primary" variant="outlined" size="small" />
            </Box>
          </Paper>

          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box> : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                    {['Item Name', 'SKU', 'Category', 'Qty', 'Unit', 'Min Qty', 'Price', 'Value', 'Location', 'Status', ''].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>No items found.</TableCell></TableRow>
                  ) : filtered.map(item => {
                    const qty = Number(item.quantity);
                    const minQty = Number(item.minimum_quantity || 10);
                    const isOut = qty === 0;
                    const isLow = qty > 0 && qty <= minQty;
                    return (
                      <TableRow key={item.id} hover sx={{ bgcolor: isOut ? '#fff5f5' : isLow ? '#fffde7' : 'inherit' }}>
                        <TableCell sx={{ fontWeight: 600 }}>{item.item_name}</TableCell>
                        <TableCell>{item.sku || '—'}</TableCell>
                        <TableCell>{item.category || '—'}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: isOut ? '#c62828' : isLow ? '#e65100' : '#2e7d32' }}>{qty.toFixed(2)}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{minQty}</TableCell>
                        <TableCell>Rs. {Number(item.price || 0).toFixed(0)}</TableCell>
                        <TableCell>Rs. {(qty * Number(item.price || 0)).toFixed(0)}</TableCell>
                        <TableCell>{item.storage_location || '—'}</TableCell>
                        <TableCell>
                          {isOut ? <Chip label="Out of Stock" color="error" size="small" />
                            : isLow ? <Chip label="Low Stock" color="warning" size="small" />
                            : <Chip label="In Stock" color="success" size="small" />}
                        </TableCell>
                        <TableCell align="right">
                          {isAdmin() && <><Tooltip title="Record Movement">
                            <IconButton size="small" color="primary" onClick={() => openMovement(item)}><SwapVert fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(item)}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><Delete fontSize="small" /></IconButton></Tooltip></>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Movement Type</InputLabel>
              <Select value={movTypeFilter} label="Movement Type" onChange={e => setMovTypeFilter(e.target.value)}>
                <MenuItem value="">All Types</MenuItem>
                {MOVEMENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Chip label={`${movTotal} movements`} variant="outlined" size="small" sx={{ alignSelf: 'center' }} />
          </Box>

          {movLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box> : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                    {['Date', 'Item', 'Type', 'Qty', 'Before', 'After', 'Reason', 'Vendor', 'Reference'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No movements recorded.</TableCell></TableRow>
                  ) : movements.map(m => (
                    <TableRow key={m.id} hover>
                      <TableCell>{m.movement_date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{m.item_name}</TableCell>
                      <TableCell><Chip label={m.movement_type.replace('_', ' ')} size="small" sx={{ bgcolor: MOV_COLOR[m.movement_type] + '22', color: MOV_COLOR[m.movement_type], fontWeight: 700 }} /></TableCell>
                      <TableCell sx={{ fontWeight: 700, color: MOV_COLOR[m.movement_type] }}>{Number(m.quantity).toFixed(2)} {m.unit}</TableCell>
                      <TableCell>{Number(m.previous_quantity).toFixed(2)}</TableCell>
                      <TableCell>{Number(m.updated_quantity).toFixed(2)}</TableCell>
                      <TableCell>{m.reason || '—'}</TableCell>
                      <TableCell>{m.vendor_name || '—'}</TableCell>
                      <TableCell>{m.reference || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}><TextField fullWidth margin="dense" label="Item Name" required value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth margin="dense" label="SKU (optional)" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Category</InputLabel>
                  <Select value={form.category} label="Category" onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <MenuItem value="">None</MenuItem>
                    {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Unit</InputLabel>
                  <Select value={form.unit} label="Unit" onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth margin="dense" label="Quantity" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} /></Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth margin="dense" label="Minimum Quantity" type="number" value={form.minimum_quantity} onChange={e => setForm(f => ({ ...f, minimum_quantity: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} /></Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth margin="dense" label="Purchase Price (Rs.)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} /></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Default Vendor (optional)</InputLabel>
                  <Select value={form.vendor_id} label="Default Vendor (optional)" onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))}>
                    <MenuItem value="">None</MenuItem>
                    {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.company_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth margin="dense" label="Storage Location" value={form.storage_location} onChange={e => setForm(f => ({ ...f, storage_location: e.target.value }))} placeholder="e.g. Shelf A, Cold Storage" /></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Status</InputLabel>
                  <Select value={form.status} label="Status" onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}><TextField fullWidth margin="dense" label="Notes" multiline minRows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editingItem ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={movDialog} onClose={() => setMovDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Stock Movement — {movTarget?.item_name}</DialogTitle>
        <form onSubmit={handleMovement}>
          <DialogContent>
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
              <Typography variant="body2">Current stock: <strong>{Number(movTarget?.quantity || 0).toFixed(2)} {movTarget?.unit}</strong></Typography>
            </Box>
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Movement Type</InputLabel>
              <Select value={movForm.movement_type} label="Movement Type" onChange={e => setMovForm(f => ({ ...f, movement_type: e.target.value }))}>
                {MOVEMENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ color: t.color }}>{t.icon}</Box>{t.label}</Box></MenuItem>)}
              </Select>
            </FormControl>
            <TextField margin="dense" label={movForm.movement_type === 'adjustment' ? 'New Quantity (absolute value)' : 'Quantity'} type="number" fullWidth required value={movForm.quantity} onChange={e => setMovForm(f => ({ ...f, quantity: e.target.value }))} inputProps={{ min: 0.01, step: 0.01 }} />
            {(movForm.movement_type === 'stock_in' || movForm.movement_type === 'return') && (
              <>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Vendor (optional)</InputLabel>
                  <Select value={movForm.vendor_id} label="Vendor (optional)" onChange={e => setMovForm(f => ({ ...f, vendor_id: e.target.value }))}>
                    <MenuItem value="">None</MenuItem>
                    {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.company_name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField margin="dense" label="Purchase Price (Rs.)" type="number" fullWidth value={movForm.purchase_price} onChange={e => setMovForm(f => ({ ...f, purchase_price: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} />
              </>
            )}
            <TextField margin="dense" label="Movement Date" type="date" fullWidth required value={movForm.movement_date} onChange={e => setMovForm(f => ({ ...f, movement_date: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField margin="dense" label="Reason" fullWidth value={movForm.reason} onChange={e => setMovForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Daily usage, Spoiled, Returned to vendor…" />
            <TextField margin="dense" label="Reference" fullWidth value={movForm.reference} onChange={e => setMovForm(f => ({ ...f, reference: e.target.value }))} placeholder="Invoice / PO number…" />
            {movForm.quantity && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="body2">
                  After movement: <strong>
                    {movForm.movement_type === 'adjustment' ? Number(movForm.quantity).toFixed(2)
                      : movForm.movement_type === 'stock_in' || movForm.movement_type === 'return'
                        ? (Number(movTarget?.quantity || 0) + Number(movForm.quantity || 0)).toFixed(2)
                        : Math.max(0, Number(movTarget?.quantity || 0) - Number(movForm.quantity || 0)).toFixed(2)
                    } {movTarget?.unit}
                  </strong>
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMovDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Record Movement</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default InventoryEnhanced;
