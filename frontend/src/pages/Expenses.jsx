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
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { expenseAPI } from '../services/api';
import toast from 'react-hot-toast';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expense_date: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await expenseAPI.getAll();
      setExpenses(response.data);
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
        expense_date: expense.expense_date.slice(0, 16),
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Expenses</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Expense
        </Button>
      </Box>

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
            {expenses.map((expense) => (
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
            <TextField
              fullWidth
              label="Category"
              margin="dense"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              margin="dense"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              minRows={2}
            />
            <TextField
              fullWidth
              label="Amount"
              margin="dense"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Expense Date"
              margin="dense"
              type="datetime-local"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Expenses;
