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
  Grid,
} from '@mui/material';
import { Edit, Delete, Add, LocalOffer, RemoveCircleOutline } from '@mui/icons-material';
import { productAPI } from '../services/api';
import { getProductDisplayPrice } from '../utils/productPricing';
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
    variants: [],
  });
  const { isAdmin } = useAuth();
  const adminMode = isAdmin();

  const categories = ['Pizza',  'Rolls & Shawarma', 'Burgers', 'Sides','Refresher', 'Ice Creams Shakes','Ice Creams','Margaritas','Milk Shake','Beverage', 'Dessert','Pasta & Lasagna','Fried Chicken'];

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
        base_price: product.base_price || product.price || '',
        variants: Array.isArray(product.variants) ? product.variants.map((variant) => ({
          id: variant.id || null,
          size_name: variant.size_name || '',
          price: variant.price ?? '',
        })) : [],
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '',
        category: '',
        base_price: '',
        variants: [],
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
      variants: [],
    });
  };

  const addVariantRow = () => {
    setFormData((prev) => ({ ...prev, variants: [...prev.variants, { size_name: '', price: '' }] }));
  };

  const updateVariant = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, variantIndex) => (
        variantIndex === index ? { ...variant, [field]: value } : variant
      )),
    }));
  };

  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  };

  const getBasePrice = () => {
    if (formData.variants.length > 0) {
      const prices = formData.variants
        .map((variant) => parseFloat(variant.price))
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
        has_sizes: formData.variants.length > 0,
        variants: formData.variants
          .filter((variant) => variant.size_name && variant.price !== '')
          .map((variant) => ({
            size_name: variant.size_name,
            price: variant.price,
          })),
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

  const getProductDisplayPriceValue = (product) => getProductDisplayPrice(product);

  const getSizePriceValue = (product, sizeKey) => {
    const value = product?.[sizeKey];
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
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
                  {Array.isArray(product.variants) && product.variants.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      {product.variants.map((variant) => (
                        <Typography key={`${product.id}-${variant.size_name}`} variant="body2">
                          {variant.size_name}: Rs. {Number(variant.price || 0).toFixed(2)}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    `Rs. ${getProductDisplayPriceValue(product).toFixed(2)}`
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
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">Pizza Variants</Typography>
                  <Button variant="outlined" size="small" onClick={addVariantRow}>Add Variant</Button>
                </Box>
                {formData.variants.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Add at least one size/price variant for pizza products.</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {formData.variants.map((variant, index) => (
                      <Grid item xs={12} md={6} key={`${variant.size_name || 'new'}-${index}`}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">Variant {index + 1}</Typography>
                            <IconButton size="small" color="error" onClick={() => removeVariant(index)}>
                              <RemoveCircleOutline />
                            </IconButton>
                          </Box>
                          <TextField
                            margin="dense"
                            label="Size Name"
                            fullWidth
                            variant="outlined"
                            value={variant.size_name}
                            onChange={(e) => updateVariant(index, 'size_name', e.target.value)}
                            required
                          />
                          <TextField
                            margin="dense"
                            label="Price"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', e.target.value)}
                            required
                            inputProps={{ step: '0.01', min: '0' }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {formData.category !== 'Pizza' && (
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
