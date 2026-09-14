import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
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
  IconButton,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import { Edit, Delete, Add, Warning } from '@mui/icons-material';
import { inventoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ item_name: '', quantity: '', unit: '', price: '' });
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    let filtered = inventory;
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (showLowStock) {
      filtered = filtered.filter(item => item.quantity <= 10);
    }
    
    setFilteredInventory(filtered);
  }, [searchTerm, showLowStock, inventory]);

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.getAll();
      setInventory(response.data);
      setFilteredInventory(response.data);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ item_name: item.item_name, quantity: item.quantity, unit: item.unit, price: item.price ?? '' });
    } else {
      setEditingItem(null);
      setFormData({ item_name: '', quantity: '', unit: '', price: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({ item_name: '', quantity: '', unit: '', price: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const parsedPrice = parseFloat(formData.price);
      if (Number.isNaN(parsedPrice)) {
        toast.error('Please enter a valid price in rupees');
        return;
      }

      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        price: parsedPrice,
      };

      if (editingItem) {
        await inventoryAPI.update(editingItem.id, payload);
        toast.success('Inventory item updated successfully');
      } else {
        await inventoryAPI.create(payload);
        toast.success('Inventory item created successfully');
      }
      handleCloseDialog();
      fetchInventory();
    } catch (error) {
      toast.error('Failed to save inventory item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryAPI.delete(id);
        toast.success('Inventory item deleted successfully');
        fetchInventory();
      } catch (error) {
        toast.error('Failed to delete inventory item');
      }
    }
  };

  const handleQuickAdjust = async (id, adjustment) => {
    try {
      await inventoryAPI.adjustQuantity(id, adjustment);
      toast.success('Quantity adjusted successfully');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to adjust quantity');
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

  const lowStockCount = inventory.filter(item => item.quantity <= 10).length;

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 }, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Inventory</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Item
          </Button>
        )}
      </Box>

      {lowStockCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<Warning />}>
          {lowStockCount} items are running low on stock (≤10 units)
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search items"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant={showLowStock ? 'contained' : 'outlined'}
          onClick={() => setShowLowStock(!showLowStock)}
          color="warning"
        >
          Show Low Stock
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell align="center">Quick Adjust</TableCell>}
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.item_name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>Rs. {parseFloat(item.price || 0).toFixed(2)}</TableCell>
                <TableCell>
                  {item.quantity <= 10 ? (
                    <Chip label="Low Stock" color="error" size="small" />
                  ) : (
                    <Chip label="In Stock" color="success" size="small" />
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell align="center">
                    <Button
                      size="small"
                      onClick={() => handleQuickAdjust(item.id, 1)}
                      sx={{ minWidth: 30 }}
                    >
                      +
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleQuickAdjust(item.id, -1)}
                      sx={{ minWidth: 30 }}
                    >
                      -
                    </Button>
                  </TableCell>
                )}
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(item)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id)} size="small">
                      <Delete />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Item Name"
              fullWidth
              variant="outlined"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Quantity"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              inputProps={{ min: '0' }}
            />
            <TextField
              margin="dense"
              label="Unit"
              fullWidth
              variant="outlined"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
              placeholder="e.g., kg, liters, pieces"
            />
            <TextField
              margin="dense"
              label="Price (Rs.)"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Inventory;
