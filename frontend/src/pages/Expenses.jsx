import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Add, Delete, Edit, Search } from '@mui/icons-material';
import { expenseAPI } from '../services/api';
import toast from 'react-hot-toast';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('all');
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expense_date: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const filtered = expenses.filter((expense) => {
      const expenseDate = new Date(expense.expense_date || Date.now());
      const matchesSearch = !lowerSearch || [expense.category, expense.description, String(expense.amount)].join(' ').toLowerCase().includes(lowerSearch);
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      const matchesRange = (() => {
        if (rangeFilter === 'today') return expenseDate >= todayStart;
        if (rangeFilter === 'week') return expenseDate >= weekStart;
        if (rangeFilter === 'month') return expenseDate >= monthStart;
        return true;
      })();
      return matchesSearch && matchesCategory && matchesRange;
    });

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, categoryFilter, rangeFilter]);

  const fetchExpenses = async () => {
    try {
      const response = await expenseAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : [];
      setExpenses(data);
      setFilteredExpenses(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        expense_date: expense.expense_date ? expense.expense_date.slice(0, 16) : '',
      });
    } else {
      setEditingExpense(null);
      setFormData({ category: '', description: '', amount: '', expense_date: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingExpense(null);
    setFormData({ category: '', description: '', amount: '', expense_date: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      expense_date: formData.expense_date || new Date().toISOString(),
    };

    try {
      if (editingExpense) {
        await expenseAPI.update(editingExpense.id, payload);
        toast.success('Expense updated');
      } else {
        await expenseAPI.create(payload);
        toast.success('Expense saved');
      }
      handleCloseDialog();
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseAPI.delete(id);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const categories = ['all', ...Array.from(new Set(expenses.map((expense) => expense.category).filter(Boolean)))];

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 }, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Expenses</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Expense
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" label="Search expenses" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ minWidth: 260, flexGrow: 1 }} InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {categories.filter((category) => category !== 'all').map((category) => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Range</InputLabel>
          <Select value={rangeFilter} label="Range" onChange={(e) => setRangeFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Expense Summary</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${filteredExpenses.length} entries`} color="primary" variant="outlined" />
            <Chip label={`Total Rs. ${totalExpenses.toFixed(2)}`} color="success" variant="outlined" />
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Expense Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>Rs. {parseFloat(expense.amount).toFixed(2)}</TableCell>
                <TableCell>{new Date(expense.expense_date).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenDialog(expense)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(expense.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField fullWidth label="Category" margin="dense" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
            <TextField fullWidth label="Description" margin="dense" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} multiline minRows={2} />
            <TextField fullWidth label="Amount" margin="dense" type="number" inputProps={{ min: 0, step: 0.01 }} value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
            <TextField fullWidth label="Expense Date" margin="dense" type="datetime-local" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Expenses;
