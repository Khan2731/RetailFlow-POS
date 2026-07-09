import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  Paper,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  ShoppingCart,
  Add,
  Remove,
  Delete,
  Search,
  Restaurant,
  LocalPizza,
  Fastfood,
  Liquor,
  Cake,
  Close,
  Pause,
  PlayArrow,
  Print,
  Receipt,
} from '@mui/icons-material';
import { productAPI, orderAPI, orderItemAPI, billingAPI, dealAPI } from '../services/api';
import toast from 'react-hot-toast';

const categoryIcons = {
  Pizza: <LocalPizza />,
  Salad: <Restaurant />,
  Appetizer: <Fastfood />,
  Beverage: <Liquor />,
  Dessert: <Cake />,
};

const categoryColors = {
  Pizza: '#ff6b6b',
  Salad: '#51cf66',
  Appetizer: '#fcc419',
  Beverage: '#339af0',
  Dessert: '#f06595',
};

const STORE_NAME = 'PizzaHub';
const STORE_TAGLINE = 'Premium Pizza Restaurant';
const STORE_ADDRESS = 'PizzaHub, Food City';
const STORE_PHONE = '03135002259';

const POS = () => {
  const formatCurrency = (value, decimals = 2) => {
    const numericValue = Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(decimals) : '0.00';
  };

  const formatSizeLabel = (size) => {
    if (!size) return '';
    return `${size.charAt(0).toUpperCase()}${size.slice(1)} size`;
  };

  const getItemDisplayName = (item) => {
    if (item.isDeal) return item.name;
    if (item.size) return `${item.name} (${formatSizeLabel(item.size)})`;
    return item.name;
  };

  const getItemSubtitle = (item) => {
    if (item.isDeal) return 'Deal bundle';
    if (item.size) return formatSizeLabel(item.size);
    return 'Regular item';
  };
  // Initialize state from localStorage
  const getInitialCart = () => {
    try {
      const saved = localStorage.getItem('pos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
      return [];
    }
  };

  const getInitialHeldOrders = () => {
    try {
      const saved = localStorage.getItem('pos_held_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading held orders from localStorage:', e);
      return [];
    }
  };

  const getInitialOrderData = () => {
    try {
      const saved = localStorage.getItem('pos_order_data');
      return saved ? JSON.parse(saved) : {
        table_no: '',
        waiter_name: '',
        tax: 8,
        discount: 0,
      };
    } catch (e) {
      console.error('Error loading order data from localStorage:', e);
      return {
        table_no: '',
        waiter_name: '',
        tax: 8,
        discount: 0,
      };
    }
  };

  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [cart, setCart] = useState(getInitialCart());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [heldOrders, setHeldOrders] = useState(getInitialHeldOrders());
  const [currentHeldOrderId, setCurrentHeldOrderId] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [printDialog, setPrintDialog] = useState(false);
  const [orderData, setOrderData] = useState(getInitialOrderData());
  const [sizeDialog, setSizeDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('small');
  const printRef = React.useRef();

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log('Saving cart to localStorage:', cart);
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  // Save held orders to localStorage whenever they change
  useEffect(() => {
    console.log('Saving held orders to localStorage:', heldOrders);
    localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders));
  }, [heldOrders]);

  // Save order data to localStorage whenever it changes
  useEffect(() => {
    console.log('Saving order data to localStorage:', orderData);
    localStorage.setItem('pos_order_data', JSON.stringify(orderData));
  }, [orderData]);

  const fetchDeals = async () => {
    try {
      const response = await dealAPI.getAll();
      setDeals(response.data || []);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent || !completedOrder) return;

    const printWindow = window.open('', '', 'width=400,height=800');
    
    const printStyles = `
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          width: 80mm;
          margin: 0 auto;
          padding: 5mm;
          background: white;
          color: #333;
        }
        .receipt-container {
          width: 100%;
          border: none;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 2px solid #1976d2;
        }
        .header h1 {
          font-size: 16px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 2px;
        }
        .header p {
          font-size: 9px;
          color: #666;
          margin: 1px 0;
        }
        .order-info {
          background: #f5f5f5;
          padding: 8px;
          border-radius: 2px;
          margin-bottom: 10px;
        }
        .order-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 10px;
        }
        .order-info-label {
          color: #666;
        }
        .order-info-value {
          color: #333;
          font-weight: 500;
        }
        .order-info-value-bold {
          color: #1976d2;
          font-weight: bold;
        }
        .items-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          padding-bottom: 5px;
          border-bottom: 1px dashed #ccc;
          font-size: 9px;
          font-weight: bold;
          color: #666;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 10px;
        }
        .item-name {
          flex: 2;
          font-weight: 500;
          color: #333;
        }
        .item-qty {
          flex: 1;
          text-align: center;
          color: #666;
        }
        .item-price {
          flex: 1;
          text-align: right;
          color: #666;
        }
        .item-total {
          flex: 1;
          text-align: right;
          font-weight: bold;
          color: #333;
        }
        .totals {
          border-top: 2px solid #1976d2;
          padding-top: 8px;
          margin-top: 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 10px;
        }
        .total-row-final {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #ccc;
          font-size: 14px;
          font-weight: bold;
          color: #1976d2;
        }
        .footer {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px dashed #ccc;
          text-align: center;
        }
        .footer p {
          font-size: 10px;
          margin: 2px 0;
        }
        .footer-thank {
          font-weight: bold;
          color: #333;
          font-size: 11px;
        }
        .footer-sub {
          color: #999;
          font-size: 8px;
        }
        .footer-web {
          color: #1976d2;
          font-size: 9px;
          font-weight: bold;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    `;

    const itemsHtml = completedOrder.items.map(item => `
      <div class="item-row">
        <div class="item-name">
          <div>${item.name}</div>
          ${item.size ? `<div style="font-size: 9px; color: #666; margin-top: 2px;">${formatSizeLabel(item.size)}</div>` : ''}
        </div>
        <div class="item-qty">${item.quantity}</div>
        <div class="item-price">Rs. ${formatCurrency(item.price, 0)}</div>
        <div class="item-total">Rs. ${formatCurrency(item.price * item.quantity, 0)}</div>
      </div>
    `).join('');

    const discountHtml = completedOrder.discount > 0 ? `
      <div class="total-row">
        <span class="order-info-label">Discount (${orderData.discount}%):</span>
        <span style="color: #d32f2f;">-Rs. ${formatCurrency(completedOrder.discount, 0)}</span>
      </div>
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Order #${completedOrder.id}</title>
          ${printStyles}
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1>🍕 ${STORE_NAME}</h1>
              <p>${STORE_TAGLINE}</p>
              <p>${STORE_ADDRESS}</p>
              <p>Tel: ${STORE_PHONE}</p>
            </div>
            <div class="order-info-row">
              <span class="order-info-label">Order #:</span>
              <span class="order-info-value-bold">${completedOrder.id}</span>
            </div>
              <div class="order-info-row">
                <span class="order-info-label">Table:</span>
                <span class="order-info-value">${completedOrder.table_no}</span>
              </div>
              <div class="order-info-row">
                <span class="order-info-label">Waiter:</span>
                <span class="order-info-value">${completedOrder.waiter_name}</span>
              </div>
              <div class="order-info-row">
                <span class="order-info-label">Date:</span>
                <span class="order-info-value" style="font-size: 9px;">${new Date(completedOrder.timestamp).toLocaleString()}</span>
              </div>
            </div>
            
            <div class="items-header">
              <span style="flex: 2;">ITEM</span>
              <span style="flex: 1; text-align: center;">QTY</span>
              <span style="flex: 1; text-align: right;">PRICE</span>
              <span style="flex: 1; text-align: right;">TOTAL</span>
            </div>
            
            <div class="items">
              ${itemsHtml}
            </div>
            
            <div class="totals">
              <div class="total-row">
                <span class="order-info-label">Subtotal:</span>
                <span class="order-info-value">Rs. ${formatCurrency(completedOrder.subtotal, 0)}</span>
              </div>
              <div class="total-row">
                <span class="order-info-label">Tax (${orderData.tax}%):</span>
                <span class="order-info-value">Rs. ${formatCurrency(completedOrder.tax, 0)}</span>
              </div>
              ${discountHtml}
              <div class="total-row-final">
                <span>TOTAL:</span>
                <span>Rs. ${formatCurrency(completedOrder.total, 0)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-thank">Thank you for dining with us!</p>
              <p class="footer-sub">We hope to see you again soon</p>
              <p class="footer-web">www.pizzahub.com</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for the window to load before printing
    printWindow.onload = function() {
      printWindow.print();
    };
  };

  useEffect(() => {
    fetchProducts();
    fetchDeals();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
    const activeDeals = deals.filter((deal) => deal.is_active);
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isSizeablePizza = (product) => {
    if (!product || product.category !== 'Pizza') return false;
    return true;
  };

  const getSizePrice = (product, size) => {
    if (!product) return 0;
    const fallbackPrice = Number(product.base_price ?? product.price ?? 0);
    switch (size) {
      case 'small':
        return Number(product.small_price ?? product.base_price ?? product.price ?? fallbackPrice);
      case 'medium':
        return Number(product.medium_price ?? product.base_price ?? product.price ?? fallbackPrice);
      case 'large':
        return Number(product.large_price ?? product.base_price ?? product.price ?? fallbackPrice);
      default:
        return fallbackPrice;
    }
  };

  const addDealToCart = (deal) => {
    const dealItem = {
      id: `deal-${deal.id}`,
      name: deal.name,
      price: parseFloat(deal.deal_price) || 0,
      quantity: 1,
      isDeal: true,
      dealItems: deal.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === dealItem.id && item.isDeal);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === dealItem.id && item.isDeal
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, dealItem];
    });

    toast.success(`${deal.name} added to cart`);
  };

  const addToCart = (product) => {
    if (isSizeablePizza(product)) {
      setSelectedProduct(product);
      setSelectedSize('small');
      setSizeDialog(true);
      return;
    }

    // For products without size options
    const price = product.base_price || product.price;
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id && !item.size);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id && !item.size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, price, quantity: 1, size: null }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleSizeSelection = () => {
    if (!selectedProduct) return;

    const price = getSizePrice(selectedProduct, selectedSize);

    const cartItem = {
      ...selectedProduct,
      price,
      quantity: 1,
      size: selectedSize
    };

    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => item.id === selectedProduct.id && item.size === selectedSize
      );
      if (existingItem) {
        return prevCart.map(item =>
          item.id === selectedProduct.id && item.size === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, cartItem];
    });

    setSizeDialog(false);
    setSelectedProduct(null);
    toast.success(`${selectedProduct.name} (${selectedSize}) added to cart`);
  };

  const removeFromCart = (productId, size = null) => {
    setCart(prevCart => 
      prevCart.filter(item => 
        item.id !== productId || (size !== null && item.size !== size)
      )
    );
  };

  const updateQuantity = (productId, delta, size = null) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId && (size === null || item.size === size)) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const taxAmount = cartTotal * (orderData.tax / 100);
  const discountAmount = cartTotal * (orderData.discount / 100);
  const finalTotal = cartTotal + taxAmount - discountAmount;

  const holdOrder = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!orderData.table_no) {
      toast.error('Please enter table number');
      return;
    }

    const heldOrder = {
      id: Date.now(),
      table_no: orderData.table_no,
      waiter_name: orderData.waiter_name,
      items: [...cart],
      tax: orderData.tax,
      discount: orderData.discount,
      timestamp: new Date().toISOString(),
    };

    setHeldOrders([...heldOrders, heldOrder]);
    setCart([]);
    setOrderData({ table_no: '', waiter_name: '', tax: 8, discount: 0 });
    setCurrentHeldOrderId(null);
    setCheckoutDialog(false);
    toast.success('Order held successfully');
  };

  const resumeOrder = (heldOrder) => {
    setCart(heldOrder.items);
    setOrderData({
      table_no: heldOrder.table_no,
      waiter_name: heldOrder.waiter_name,
      tax: heldOrder.tax,
      discount: heldOrder.discount,
    });
    setHeldOrders(heldOrders.filter(o => o.id !== heldOrder.id));
    setCurrentHeldOrderId(heldOrder.id);
    setCheckoutDialog(false);
    toast.success('Order resumed. Add more products from the menu and then view order to complete it.');
  };

  const deleteHeldOrder = (orderId) => {
    setHeldOrders(heldOrders.filter(o => o.id !== orderId));
    if (currentHeldOrderId === orderId) {
      setCurrentHeldOrderId(null);
    }
    toast.success('Held order deleted');
  };

  const clearCart = () => {
    setCurrentHeldOrderId(null);
    setCart([]);
    setOrderData({ table_no: '', waiter_name: '', tax: 8, discount: 0 });
    localStorage.removeItem('pos_cart');
    localStorage.removeItem('pos_order_data');
    toast.success('Cart cleared');
  };

  const completeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!orderData.table_no || !orderData.waiter_name) {
      toast.error('Please fill in table number and waiter name');
      return;
    }

    try {
      const orderResponse = await orderAPI.create({
        table_no: parseInt(orderData.table_no),
        waiter_name: orderData.waiter_name,
        status: 'completed',
      });

      const orderId = orderResponse.data.order.id;

      for (const item of cart) {
        if (item.isDeal && Array.isArray(item.dealItems) && item.dealItems.length > 0) {
          for (const dealItem of item.dealItems) {
            await orderItemAPI.create({
              order_id: orderId,
              product_id: dealItem.product_id,
              quantity: dealItem.quantity * item.quantity,
            });
          }
          continue;
        }

        await orderItemAPI.create({
          order_id: orderId,
          product_id: item.id,
          quantity: item.quantity,
        });
      }

      // Create billing record
      await billingAPI.create({
        order_id: orderId,
        subtotal: cartTotal,
        tax: taxAmount,
        discount: discountAmount,
        total: finalTotal,
        payment_method: 'cash',
      });

      setCompletedOrder({
        id: orderId,
        table_no: orderData.table_no,
        waiter_name: orderData.waiter_name,
        items: cart,
        subtotal: cartTotal,
        tax: taxAmount,
        discount: discountAmount,
        total: finalTotal,
        timestamp: new Date().toISOString(),
      });

      // Clear localStorage after successful order completion
      localStorage.removeItem('pos_cart');
      localStorage.removeItem('pos_order_data');

      setCart([]);
      setCheckoutDialog(false);
      setOrderData({ table_no: '', waiter_name: '', tax: 8, discount: 0 });
      setPrintDialog(true);
      toast.success('Order completed successfully');
    } catch (error) {
      console.error('Order completion error:', error);
      toast.error(error.response?.data?.error || 'Failed to complete order');
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f2f4f9', pb: 4 }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#1d4ed8' }}>
        <Toolbar sx={{ minHeight: 72 }}>
          <Typography variant="h5" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
            <LocalPizza sx={{ fontSize: 28 }} />
            PizzaHub POS
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setCheckoutDialog(true)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            <Badge badgeContent={cartCount} color="error" sx={{ mr: 1 }}>
              <ShoppingCart />
            </Badge>
            View Order
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        

        <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 4, boxShadow: '0 14px 35px rgba(15,23,42,0.06)' }}>
          <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Search sx={{ color: 'text.secondary' }} />
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {categories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => setSelectedCategory(category)}
                  sx={{
                    bgcolor: selectedCategory === category ? categoryColors[category] || '#1976d2' : '#eef2ff',
                    color: selectedCategory === category ? 'white' : 'text.primary',
                    border: '1px solid rgba(15,23,42,0.08)',
                    '&:hover': {
                      bgcolor: selectedCategory === category ? categoryColors[category] || '#1565c0' : '#dbe4ff',
                    },
                  }}
                />
              ))}
              {heldOrders.length > 0 && (
                <Badge badgeContent={heldOrders.length} color="warning">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Pause />}
                    onClick={() => setCheckoutDialog(true)}
                  >
                    Held Orders
                  </Button>
                </Badge>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        {activeDeals.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Active Deals
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Add deal bundles quickly.
              </Typography>
            </Box>
            <Grid container spacing={1}>
              {activeDeals.map((deal) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={deal.id}>
                  <Card sx={{ borderRadius: 2, minHeight: 170, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 24px rgba(15,23,42,0.06)', border: '1px solid rgba(15,23,42,0.08)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>
                        Deal Bundle
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {deal.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {deal.items.slice(0, 2).map((item, index) => `${item.product_name || 'Item'} x${item.quantity}`).join(', ')}{deal.items.length > 2 ? ` +${deal.items.length - 2} more` : ''}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                        Rs. {formatCurrency(deal.deal_price)}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 1.5 }}>
                      <Button variant="contained" fullWidth size="small" onClick={() => addDealToCart(deal)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Add
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Menu Items
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tap any product to add it to the cart.
          </Typography>
        </Box>

        <Grid container spacing={1}>
          {filteredProducts.map(product => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={product.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  border: '1px solid rgba(15,23,42,0.08)',
                  boxShadow: '0 8px 18px rgba(15,23,42,0.06)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onClick={() => addToCart(product)}
              >
                <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5, display: 'block' }}>
                    {product.category}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                    Rs. {formatCurrency((product.has_sizes ? (product.small_price ?? product.base_price) : product.base_price) || product.price || 0, 0)}
                  </Typography>
                </CardContent>
                <Divider />
                <Box sx={{ p: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Add
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      </Container>

      <Dialog open={checkoutDialog} onClose={() => setCheckoutDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Current Order</Typography>
            <IconButton onClick={() => setCheckoutDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Order Details
                </Typography>
                {currentHeldOrderId && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px solid #81c784' }}>
                    <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                      Held order resumed. Add more products from the menu, then view the order to finish.
                    </Typography>
                  </Box>
                )}
                <TextField
                  fullWidth
                  label="Table Number"
                  type="number"
                  value={orderData.table_no}
                  onChange={(e) => setOrderData({ ...orderData, table_no: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Waiter Name"
                  value={orderData.waiter_name}
                  onChange={(e) => setOrderData({ ...orderData, waiter_name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Tax (%)"
                  type="number"
                  value={orderData.tax}
                  onChange={(e) => setOrderData({ ...orderData, tax: parseFloat(e.target.value) || 0 })}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
                <TextField
                  fullWidth
                  label="Discount (%)"
                  type="number"
                  value={orderData.discount}
                  onChange={(e) => setOrderData({ ...orderData, discount: parseFloat(e.target.value) || 0 })}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Held Orders ({heldOrders.length})
              </Typography>
              {heldOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No held orders
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {heldOrders.map(heldOrder => (
                    <Paper key={heldOrder.id} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2">Table {heldOrder.table_no}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {heldOrder.items.length} items • Rs. {formatCurrency(heldOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0))}
                        </Typography>
                      </Box>
                          <Button
                        size="small"
                        variant={currentHeldOrderId === heldOrder.id ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => resumeOrder(heldOrder)}
                      >
                        {currentHeldOrderId === heldOrder.id ? 'Editing' : 'Resume & Add'}
                      </Button>
                      <IconButton size="small" onClick={() => deleteHeldOrder(heldOrder.id)} color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
                Cart Items ({cartCount})
              </Typography>
              {cart.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(15,23,42,0.12)' }}>
                  <Typography variant="body2" color="text.secondary">
                    Cart is empty
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {cart.map((item, index) => (
                    <Paper key={`${item.id}-${item.size || 'no-size'}-${index}`} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3, border: '1px solid rgba(15,23,42,0.08)', bgcolor: '#ffffff' }}>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {getItemDisplayName(item)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {getItemSubtitle(item)} • Rs. {formatCurrency(item.price)}
                          </Typography>
                          {item.size && (
                            <Chip label={formatSizeLabel(item.size)} size="small" color="primary" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}> 
                        <Button size="small" variant="outlined" onClick={() => updateQuantity(item.id, -1, item.size)} sx={{ minWidth: 32, p: 0.5 }}>
                          <Remove fontSize="small" />
                        </Button>
                        <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <Button size="small" variant="outlined" onClick={() => updateQuantity(item.id, 1, item.size)} sx={{ minWidth: 32, p: 0.5 }}>
                          <Add fontSize="small" />
                        </Button>
                      </Box>
                      <Typography variant="subtitle2" sx={{ minWidth: 80, textAlign: 'right' }}>
                        Rs. {formatCurrency(item.price * item.quantity)}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => removeFromCart(item.id, item.size)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid rgba(15,23,42,0.08)' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Order Summary
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Subtotal</Typography>
                    <Typography variant="body2">Rs. {formatCurrency(cartTotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tax ({orderData.tax}%)</Typography>
                    <Typography variant="body2">Rs. {formatCurrency(taxAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Discount ({orderData.discount}%)</Typography>
                    <Typography variant="body2" color="error">-Rs. {formatCurrency(discountAmount)}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total</Typography>
                    <Typography variant="h6" color="primary">
                      Rs. {formatCurrency(finalTotal)}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={completeOrder}
                  disabled={cart.length === 0}
                  sx={{ mt: 3, py: 1.5, textTransform: 'none', fontWeight: 700 }}
                  startIcon={<Receipt />}
                >
                  Complete & Print
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={holdOrder}
                  disabled={cart.length === 0}
                  sx={{ mt: 2, py: 1.5, textTransform: 'none', fontWeight: 700 }}
                  startIcon={<Pause />}
                >
                  Hold Order
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  color="error"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  sx={{ mt: 1, textTransform: 'none' }}
                >
                  Clear Cart
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      <Dialog open={printDialog} onClose={() => setPrintDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Receipt</Typography>
            <IconButton onClick={() => setPrintDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {completedOrder && (
            <Box
              ref={printRef}
              sx={{
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                p: 3,
                bgcolor: '#ffffff',
                width: '300px',
                mx: 'auto',
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: '2px solid #1976d2' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5, fontSize: '18px' }}>
                  🍕 PizzaHub
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', fontSize: '10px' }}>
                  {STORE_TAGLINE}
                </Typography>
                <Typography variant="caption" sx={{ color: '#999', fontSize: '9px' }}>
                  {STORE_ADDRESS}
                </Typography>
                <Typography variant="caption" sx={{ color: '#999', fontSize: '9px' }}>
                  Tel: {STORE_PHONE}
                </Typography>
              </Box>

              {/* Order Info */}
              <Box sx={{ mb: 3, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333' }}>Order #:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{completedOrder.id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>Table:</Typography>
                  <Typography variant="body2" sx={{ color: '#333' }}>{completedOrder.table_no}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>Waiter:</Typography>
                  <Typography variant="body2" sx={{ color: '#333' }}>{completedOrder.waiter_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>Date:</Typography>
                  <Typography variant="body2" sx={{ color: '#333', fontSize: '9px' }}>
                    {new Date(completedOrder.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Items Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pb: 1, borderBottom: '1px dashed #ccc', fontSize: '9px', fontWeight: 'bold', color: '#666' }}>
                <Typography sx={{ flex: 2 }}>ITEM</Typography>
                <Typography sx={{ flex: 1, textAlign: 'center' }}>QTY</Typography>
                <Typography sx={{ flex: 1, textAlign: 'right' }}>PRICE</Typography>
                <Typography sx={{ flex: 1, textAlign: 'right' }}>TOTAL</Typography>
              </Box>

              {/* Items */}
              <Box sx={{ mb: 3 }}>
                {completedOrder.items.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 2, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '10px', color: '#333', fontWeight: 500 }}>
                        {getItemDisplayName(item)}
                      </Typography>
                      {item.size && (
                        <Typography sx={{ fontSize: '9px', color: '#666', mt: 0.25 }}>
                          {formatSizeLabel(item.size)}
                        </Typography>
                      )}
                    </Box>
                    <Typography sx={{ flex: 1, textAlign: 'center', fontSize: '10px', color: '#666' }}>
                      {item.quantity}
                    </Typography>
                    <Typography sx={{ flex: 1, textAlign: 'right', fontSize: '10px', color: '#666' }}>
                      Rs. {formatCurrency(item.price, 0)}
                    </Typography>
                    <Typography sx={{ flex: 1, textAlign: 'right', fontSize: '10px', fontWeight: 'bold', color: '#333' }}>
                      Rs. {formatCurrency(item.price * item.quantity, 0)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Totals */}
              <Box sx={{ borderTop: '2px solid #1976d2', pt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>Subtotal:</Typography>
                  <Typography variant="body2" sx={{ color: '#333' }}>Rs. {formatCurrency(completedOrder.subtotal, 0)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>Tax ({orderData.tax}%):</Typography>
                  <Typography variant="body2" sx={{ color: '#333' }}>Rs. {formatCurrency(completedOrder.tax, 0)}</Typography>
                </Box>
                {completedOrder.discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#666' }}>Discount ({orderData.discount}%):</Typography>
                    <Typography variant="body2" sx={{ color: '#d32f2f' }}>-Rs. {formatCurrency(completedOrder.discount, 0)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px dashed #ccc' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '14px' }}>TOTAL:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '14px' }}>
                    Rs. {formatCurrency(completedOrder.total, 0)}
                  </Typography>
                </Box>
              </Box>

              {/* Footer */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #ccc', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333', mb: 1, fontSize: '11px' }}>
                  Thank you for dining with us!
                </Typography>
                <Typography variant="caption" sx={{ color: '#999', fontSize: '9px', display: 'block', mb: 0.5 }}>
                  We hope to see you again soon
                </Typography>
                <Typography variant="caption" sx={{ color: '#1976d2', fontSize: '9px', fontWeight: 'bold' }}>
                  www.pizzahub.com
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialog(false)}>Close</Button>
          <Button variant="contained" onClick={handlePrint} startIcon={<Print />}>
            Print Receipt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Size Selection Dialog */}
      <Dialog open={sizeDialog} onClose={() => setSizeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Size</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>{selectedProduct.name}</Typography>
              <FormControl fullWidth margin="dense">
                <InputLabel>Size</InputLabel>
                <Select
                  value={selectedSize}
                  label="Size"
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  <MenuItem value="small">
                    Small - Rs. {formatCurrency(getSizePrice(selectedProduct, 'small'), 0)}
                  </MenuItem>
                  <MenuItem value="medium">
                    Medium - Rs. {formatCurrency(getSizePrice(selectedProduct, 'medium'), 0)}
                  </MenuItem>
                  <MenuItem value="large">
                    Large - Rs. {formatCurrency(getSizePrice(selectedProduct, 'large'), 0)}
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSizeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSizeSelection}>
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default POS;
