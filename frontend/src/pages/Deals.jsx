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
  IconButton,
  CircularProgress,
  Grid,
  Chip,
  FormControlLabel,
  Switch,
  MenuItem,
  FormControl,
} from '@mui/material';
import { Edit, Delete, Add, LocalOffer } from '@mui/icons-material';
import { dealAPI, productAPI } from '../services/api';
import { getProductDisplayPrice } from '../utils/productPricing';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deal_price: '',
    is_active: true,
    items: []
  });
  const { isAdmin } = useAuth();
  const adminMode = isAdmin();

  const formatSizeLabel = (size) => {
    if (!size) return '';
    const normalizedSize = String(size).toLowerCase();
    if (normalizedSize === 'xl') return 'XL';
    if (normalizedSize === 'large') return 'Large';
    if (normalizedSize === 'medium') return 'Medium';
    return 'Small';
  };

  useEffect(() => {
    fetchDeals();
    fetchProducts();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await dealAPI.getAll();
      setDeals(response.data);
    } catch (error) {
      toast.error('Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const handleOpenDialog = (deal = null) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        name: deal.name,
        description: deal.description || '',
        deal_price: deal.deal_price,
        is_active: deal.is_active,
        items: deal.items || []
      });
    } else {
      setEditingDeal(null);
      setFormData({
        name: '',
        description: '',
        deal_price: '',
        is_active: true,
        items: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDeal(null);
    setFormData({
      name: '',
      description: '',
      deal_price: '',
      is_active: true,
      items: []
    });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, size: 'small' }]
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    if (field === 'product_id') {
      const selectedProduct = products.find((product) => String(product.id) === String(value));
      if (selectedProduct && selectedProduct.category === 'Pizza' && selectedProduct.has_sizes) {
        updatedItems[index].size = updatedItems[index].size || 'small';
      } else {
        updatedItems[index].size = null;
      }
    }

    setFormData({ ...formData, items: updatedItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item to the deal');
      return;
    }

    const validItems = formData.items.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please select products and quantities for all items');
      return;
    }

    try {
      const dealData = {
        name: formData.name,
        description: formData.description,
        deal_price: parseFloat(formData.deal_price),
        is_active: formData.is_active,
        items: validItems
      };

      if (editingDeal) {
        await dealAPI.update(editingDeal.id, dealData);
        toast.success('Deal updated successfully');
      } else {
        await dealAPI.create(dealData);
        toast.success('Deal created successfully');
      }
      handleCloseDialog();
      fetchDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error(error.response?.data?.error || 'Failed to save deal');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await dealAPI.delete(id);
        toast.success('Deal deleted successfully');
        fetchDeals();
      } catch (error) {
        toast.error('Failed to delete deal');
      }
    }
  };

  const handleToggleActive = async (deal) => {
    try {
      await dealAPI.update(deal.id, { ...deal, is_active: !deal.is_active });
      toast.success('Deal status updated');
      fetchDeals();
    } catch (error) {
      toast.error('Failed to update deal status');
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
        <Typography variant="h4">Deals</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Deal
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Deal Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Deal Price</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Status</TableCell>
              {adminMode && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {deals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalOffer color="primary" />
                    <Typography fontWeight="bold">{deal.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{deal.description || '-'}</TableCell>
                <TableCell>Rs. {parseFloat(deal.deal_price).toFixed(0)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {deal.items && deal.items.map((item, index) => (
                      <Chip
                        key={index}
                        size="small"
                        label={`${item.product_name}${item.size ? ` (${formatSizeLabel(item.size)})` : ''} x${item.quantity}`}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={deal.is_active ? 'Active' : 'Inactive'}
                    color={deal.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                {adminMode && (
                  <TableCell align="right">
                    <IconButton onClick={() => handleToggleActive(deal)} size="small">
                      <Switch checked={deal.is_active} size="small" />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog(deal)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(deal.id)} size="small">
                      <Delete />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingDeal ? 'Edit Deal' : 'Add Deal'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Deal Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Deal Price"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.deal_price}
              onChange={(e) => setFormData({ ...formData, deal_price: e.target.value })}
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Deal Items</Typography>
              {formData.items.map((item, index) => {
                const selectedProduct = products.find((product) => String(product.id) === String(item.product_id));
                const showSizeSelect = selectedProduct?.category === 'Pizza' && selectedProduct?.has_sizes;

                return (
                  <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                    <Grid item xs={showSizeSelect ? 5 : 6}>
                      <FormControl fullWidth>
                        <TextField
                          select
                          label="Product"
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          required
                        >
                          {products.map((product) => (
                            <MenuItem key={product.id} value={product.id}>
                              {product.name} - {product.has_sizes ? `S/M/L/XL` : `Rs. ${getProductDisplayPrice(product).toFixed(2)}`}
                            </MenuItem>
                          ))}
                        </TextField>
                      </FormControl>
                    </Grid>
                    {showSizeSelect && (
                      <Grid item xs={3}>
                        <TextField
                          select
                          label="Size"
                          fullWidth
                          value={item.size || 'small'}
                          onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                        >
                          <MenuItem value="small">Small</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="large">Large</MenuItem>
                          <MenuItem value="xl">XL</MenuItem>
                        </TextField>
                      </Grid>
                    )}
                    <Grid item xs={showSizeSelect ? 3 : 4}>
                      <TextField
                        label="Quantity"
                        type="number"
                        fullWidth
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                        required
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton onClick={() => handleRemoveItem(index)} color="error">
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                );
              })}
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddItem}
                fullWidth
              >
                Add Item
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingDeal ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Deals;
