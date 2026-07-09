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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import { Edit, Delete, Add, LocalOffer } from '@mui/icons-material';
import { productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    category: '', 
    base_price: '', 
    has_sizes: false,
    small_price: '',
    medium_price: '',
    large_price: ''
  });
  const { isAdmin } = useAuth();
  const adminMode = isAdmin();

  const categories = ['Pizza', 'Salad', 'Appetizer', 'Beverage', 'Dessert'];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, products]);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ 
        name: product.name, 
        category: product.category, 
        base_price: product.base_price || product.price,
        has_sizes: product.has_sizes === 1 || product.has_sizes === true,
        small_price: product.small_price || '',
        medium_price: product.medium_price || '',
        large_price: product.large_price || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        category: '', 
        base_price: '', 
        has_sizes: false,
        small_price: '',
        medium_price: '',
        large_price: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      category: '', 
      base_price: '', 
      has_sizes: false,
      small_price: '',
      medium_price: '',
      large_price: ''
    });
  };

  const getBasePrice = () => {
    if (formData.has_sizes) {
      const prices = [formData.small_price, formData.medium_price, formData.large_price]
        .map((value) => parseFloat(value))
        .filter((price) => !Number.isNaN(price));
      return prices.length > 0 ? Math.min(...prices) : '';
    }
    return formData.base_price;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
        name: formData.name,
        category: formData.category,
        base_price: getBasePrice(),
        has_sizes: formData.has_sizes,
        small_price: formData.has_sizes ? formData.small_price : null,
        medium_price: formData.has_sizes ? formData.medium_price : null,
        large_price: formData.has_sizes ? formData.large_price : null,
      };

      if (editingProduct) {
        await productAPI.update(editingProduct.id, dataToSend);
        toast.success('Product updated successfully');
      } else {
        await productAPI.create(dataToSend);
        toast.success('Product created successfully');
      }
      handleCloseDialog();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error.response?.data || error);
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
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

  const getProductDisplayPrice = (product) => {
    if (product.has_sizes) {
      const priceValues = [product.small_price, product.medium_price, product.large_price]
        .map((value) => parseFloat(value))
        .filter((price) => !Number.isNaN(price));
      return priceValues.length ? Math.min(...priceValues) : parseFloat(product.base_price || product.price || 0);
    }
    return parseFloat(product.base_price || product.price || 0);
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 }, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<LocalOffer />}
            onClick={() => window.location.href = '/deals'}
          >
            Manage Deals
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search products"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              {adminMode && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  {product.has_sizes ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      <Typography variant="body2">S: Rs. {parseFloat(product.small_price || 0).toFixed(2)}</Typography>
                      <Typography variant="body2">M: Rs. {parseFloat(product.medium_price || 0).toFixed(2)}</Typography>
                      <Typography variant="body2">L: Rs. {parseFloat(product.large_price || 0).toFixed(2)}</Typography>
                    </Box>
                  ) : (
                    `Rs. ${getProductDisplayPrice(product).toFixed(2)}`
                  )}
                </TableCell>
                {adminMode && (
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(product)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(product.id)} size="small">
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
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Product Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {formData.category === 'Pizza' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.has_sizes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        has_sizes: e.target.checked,
                        small_price: e.target.checked ? formData.small_price : '',
                        medium_price: e.target.checked ? formData.medium_price : '',
                        large_price: e.target.checked ? formData.large_price : '',
                      })
                    }
                  />
                }
                label="Has Size Options"
                sx={{ mt: 2 }}
              />
            )}
            
            {formData.category === 'Pizza' && formData.has_sizes ? (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={4}>
                  <TextField
                    margin="dense"
                    label="Small Price"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={formData.small_price}
                    onChange={(e) => setFormData({ ...formData, small_price: e.target.value })}
                    required
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    margin="dense"
                    label="Medium Price"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={formData.medium_price}
                    onChange={(e) => setFormData({ ...formData, medium_price: e.target.value })}
                    required
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    margin="dense"
                    label="Large Price"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={formData.large_price}
                    onChange={(e) => setFormData({ ...formData, large_price: e.target.value })}
                    required
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
              </Grid>
            ) : (
              <TextField
                margin="dense"
                label="Base Price"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                required
                inputProps={{ step: '0.01', min: '0' }}
                sx={{ mt: 2 }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Products;
