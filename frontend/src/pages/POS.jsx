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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
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
  History,
  Logout,
} from '@mui/icons-material';
import { productAPI, orderAPI, orderItemAPI, billingAPI, dealAPI, shiftAPI } from '../services/api';
import { getProductBasePrice, getProductSizePrice } from '../utils/productPricing';
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
const STORE_ADDRESS = 'Kot Garhi Kapura';
const STORE_PHONE_1 = '03715717579';
const STORE_PHONE_2 = '03005717579';

const defaultOrderData = {
  table_no: '',
  waiter_name: '',
  customer_name: '',
  customer_contact: '',
  customer_address: '',
  tax: 0,
  discount: 0,
  order_type: 'dine_in',
  payment_method: 'cash',
};

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
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((order) => {
        const idValue = typeof order.id === 'string' ? parseInt(order.id, 10) : order.id;
        const isLikelyLocal = Number.isFinite(idValue) && idValue > 2147483647;
        return {
          ...order,
          id: idValue,
          local: order.local ?? isLikelyLocal,
        };
      });
    } catch (e) {
      console.error('Error loading held orders from localStorage:', e);
      return [];
    }
  };

  const getInitialOrderData = () => {
    try {
      const saved = localStorage.getItem('pos_order_data');
      if (!saved) return { ...defaultOrderData };
      const parsed = JSON.parse(saved);
      return { ...defaultOrderData, ...parsed };
    } catch (e) {
      console.error('Error loading order data from localStorage:', e);
      return { ...defaultOrderData };
    }
  };

  const getOrderTypeLabel = (type) => {
    switch (type) {
      case 'take_away':
        return 'Take Away';
      case 'delivery':
        return 'Delivery';
      default:
        return 'Dine In';
    }
  };

  const getOrderValidationError = () => {
    const orderType = orderData.order_type || 'dine_in';

    if (orderType === 'dine_in') {
      if (!orderData.table_no) return 'Please select a table number';
      if (!String(orderData.waiter_name || '').trim()) return 'Please enter waiter name';
      return '';
    }

    if (!String(orderData.customer_name || '').trim()) return 'Please enter customer name';
    if (!String(orderData.customer_contact || '').trim()) return 'Please enter contact number';

    if (orderType === 'delivery' && !String(orderData.customer_address || '').trim()) {
      return 'Please enter delivery address';
    }

    return '';
  };

  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [cart, setCart] = useState(getInitialCart());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
  const [todaysOrders, setTodaysOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [todaysSalesLoading, setTodaysSalesLoading] = useState(false);
  const [ordersSelected, setOrdersSelected] = useState(null);
  const [ordersItems, setOrdersItems] = useState([]);
  const [heldOrders, setHeldOrders] = useState(getInitialHeldOrders());
  const [currentHeldOrderId, setCurrentHeldOrderId] = useState(null);
  const [currentHeldOrderDatabaseId, setCurrentHeldOrderDatabaseId] = useState(null);
  const [currentHeldOrderNumber, setCurrentHeldOrderNumber] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [orderData, setOrderData] = useState(getInitialOrderData());
  const [sizeDialog, setSizeDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('small');
  const [iceCreamDialog, setIceCreamDialog] = useState(false);
  // cupScoops: { [productId]: count }  — tracks how many scoops of each flavour are in the current cup
  const [cupScoops, setCupScoops] = useState({});
  const [heldOrdersDialog, setHeldOrdersDialog] = useState(false);
  const [heldOrdersSearch, setHeldOrdersSearch] = useState('');
  const [heldOrdersFilter, setHeldOrdersFilter] = useState('all'); // all, dine_in, take_away, delivery
  const [heldOrdersSort, setHeldOrdersSort] = useState('newest'); // newest, oldest
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelCandidate, setCancelCandidate] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [shiftLoading, setShiftLoading] = useState(false);
  const [activeShift, setActiveShift] = useState(null);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [shiftOpeningCash, setShiftOpeningCash] = useState('0');
  const [shiftClosingCash, setShiftClosingCash] = useState('0');

  // Order number: persisted in localStorage, resets at midnight
  const getInitialOrderNumber = () => {
    try {
      const saved = localStorage.getItem('pos_order_number_data');
      if (!saved) return 1;
      const { number, date } = JSON.parse(saved);
      const today = new Date().toDateString();
      if (date !== today) return 1; // new day — reset
      return number;
    } catch {
      return 1;
    }
  };
  const orderNumberRef = React.useRef(getInitialOrderNumber());

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  // Save held orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders));
  }, [heldOrders]);

  // Save order data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pos_order_data', JSON.stringify(orderData));
  }, [orderData]);

  useEffect(() => {
    fetchActiveShift();
  }, []);

  const fetchActiveShift = async () => {
    try {
      const response = await shiftAPI.getActive();
      setActiveShift(response.data || null);
    } catch (error) {
      console.error('Failed to fetch active shift:', error);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await dealAPI.getAll();
      setDeals(response.data || []);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    }
  };

  const handlePrint = async (receiptData = completedOrder) => {
    if (!receiptData) return false;

    const printWindow = window.open('', '_blank', 'width=0,height=0');
    if (!printWindow) {
      toast.error('Please allow popups for printing.');
      return false;
    }

    const itemsHtml = receiptData.items.map(item => {
      const dealSubItemsHtml = item.isDeal && Array.isArray(item.dealItems) && item.dealItems.length > 0
        ? item.dealItems.map(di => `
            <div style="display: flex; align-items: center; margin: 2px 0 2px 10px; font-size: 10px; font-weight: bold; color: #000 !important;">
              <span style="margin-right: 4px; color: #000 !important;">&#8226;</span>
              <span style="font-weight: bold; color: #000 !important;">${di.product_name}${di.size ? ` (${di.size.toLowerCase() === 'xl' ? 'XL' : di.size.charAt(0).toUpperCase() + di.size.slice(1)})` : ''}</span>
              <span style="margin-left: 4px; color: #000 !important;">x${di.quantity * item.quantity}</span>
            </div>
          `).join('')
        : '';

      return `
        <div style="margin-bottom: 7px; font-size: 12px; font-weight: bold; color: #000 !important;">
          <div style="display: flex; justify-content: space-between; color: #000 !important;">
            <div style="flex: 1; padding-right: 8px;">
              <div style="font-weight: bold; color: #000 !important;">${item.name}${item.isDeal ? ' [Deal]' : ''}</div>
              ${item.size ? `<div style="font-size: 10px; font-weight: bold; color: #000 !important;">${formatSizeLabel(item.size)}</div>` : ''}
            </div>
            <div style="width: 28px; text-align: center; font-weight: bold; color: #000 !important;">${item.quantity}</div>
            <div style="width: 70px; text-align: right; font-weight: bold; color: #000 !important;"> ${formatCurrency(item.price, 0)}</div>
            <div style="width: 75px; text-align: right; font-weight: bold; color: #000 !important;"> ${formatCurrency(item.price * item.quantity, 0)}</div>
          </div>
          ${dealSubItemsHtml}
        </div>
      `;
    }).join('');

    const discountHtml = receiptData.discount > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 12px; font-weight: bold; color: #000 !important;">
        <span style="font-weight: bold; color: #000 !important;">Discount (${orderData.discount}%):</span>
        <span style="font-weight: bold; color: #000 !important;">-Rs. ${formatCurrency(receiptData.discount, 0)}</span>
      </div>
    ` : '';

    const printMarkup = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt #${receiptData.id}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box;
      color: #000 !important;
      font-weight: bold !important;
    }

    html, body {
      color: #000 !important;
      font-weight: bold !important;
    }

    body {
      font-family: 'Courier New', 'Consolas', monospace;
      width: 80mm;
      margin: 0 auto;
      padding: 6mm;
      background: #fff;
      color: #000 !important;
      font-size: 12px;
      font-weight: bold;
      line-height: 1.4;
    }

    .title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      color: #000 !important;
      text-transform: uppercase;
    }

    .sub {
      text-align: center;
      font-size: 10.5px;
      font-weight: bold;
      margin-bottom: 2px;
      color: #000 !important;
    }

    .divider {
      border-top: 1.5px dashed #000;
      margin: 8px 0;
    }

    .divider.solid {
      border-top: 2px solid #000;
    }

    .order-no {
      text-align: center;
      margin: 8px 0;
    }

    .serial-no {
      text-align: center;
      margin: 2px 0 8px;
    }

    .serial-no .label {
      font-size: 9px;
      font-weight: bold;
      color: #000 !important;
    }

    .serial-no .value {
      font-size: 12px;
      font-weight: bold;
      color: #000 !important;
    }

    .order-no .label {
      font-size: 10.5px;
      font-weight: bold;
      color: #000 !important;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .order-no .value {
      font-size: 22px;
      font-weight: bold;
      color: #000 !important;
      margin-top: 2px;
    }

    .meta-row,
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin: 3px 0;
      font-size: 11.5px;
      font-weight: bold;
      color: #000 !important;
    }

    .meta-label,
    .total-label {
      font-weight: bold;
      width: 40%;
      text-align: left;
      color: #000 !important;
    }

    .meta-value,
    .total-value {
      width: 58%;
      text-align: right;
      font-weight: bold;
      word-break: break-word;
      color: #000 !important;
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      font-weight: bold;
      color: #000 !important;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .items-header .h-item { flex: 1; color: #000 !important; font-weight: bold; }
    .items-header .h-qty { width: 28px; text-align: center; color: #000 !important; font-weight: bold; }
    .items-header .h-price { width: 70px; text-align: right; color: #000 !important; font-weight: bold; }
    .items-header .h-amt { width: 75px; text-align: right; color: #000 !important; font-weight: bold; }

    .totals {
      margin-top: 6px;
      font-size: 12px;
      font-weight: bold;
      color: #000 !important;
    }

    .grand-total {
      font-size: 15px;
      font-weight: bold;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 2px solid #000;
      color: #000 !important;
    }

    .grand-total .total-value,
    .grand-total .total-label {
      font-weight: bold;
      color: #000 !important;
    }

    .footer {
      text-align: center;
      margin-top: 10px;
      font-size: 11px;
      font-weight: bold;
      color: #000 !important;
    }

    .footer-sub {
      text-align: center;
      margin-top: 2px;
      font-size: 9px;
      font-weight: bold;
      color: #000 !important;
    }
  </style>
</head>

<body>

  <div class="title">🍕 ${STORE_NAME} </div>
  <div class="sub">${STORE_TAGLINE}</div>
  <div class="sub">${STORE_ADDRESS}</div>
  <div class="sub">Tel: ${STORE_PHONE_1} / ${STORE_PHONE_2}</div>

  <div class="divider solid"></div>

  <div class="order-no">
    <div class="label">Order No.</div>
    <div class="value">#${receiptData.order_number ?? receiptData.id}</div>
  </div>

  <div class="serial-no">
    <div class="label">Serial No.</div>
    <div class="value">#${receiptData.id ?? '-'}</div>
  </div>

  <div class="divider"></div>

  ${receiptData.order_type === 'dine_in' ? `
  <div class="meta-row">
    <div class="meta-label">Table</div>
    <div class="meta-value">${receiptData.table_no || '-'}</div>
  </div>

  <div class="meta-row">
    <div class="meta-label">Waiter</div>
    <div class="meta-value">${receiptData.waiter_name || '-'}</div>
  </div>
  ` : ''}

  ${receiptData.order_type === 'take_away' ? `
  <div class="meta-row">
    <div class="meta-label">Customer</div>
    <div class="meta-value">${receiptData.customer_name || '-'}</div>
  </div>

  <div class="meta-row">
    <div class="meta-label">Contact</div>
    <div class="meta-value">${receiptData.customer_contact || '-'}</div>
  </div>
  ` : ''}

  ${receiptData.order_type === 'delivery' ? `
  <div class="meta-row">
    <div class="meta-label">Customer</div>
    <div class="meta-value">${receiptData.customer_name || '-'}</div>
  </div>

  <div class="meta-row">
    <div class="meta-label">Contact</div>
    <div class="meta-value">${receiptData.customer_contact || '-'}</div>
  </div>

  <div class="meta-row">
    <div class="meta-label">Address</div>
    <div class="meta-value">${receiptData.customer_address || '-'}</div>
  </div>
  ` : ''}

 <div class="meta-row">
    <div class="meta-label">Order Type</div>
    <div class="meta-value">
      ${
        receiptData.order_type === 'take_away'
          ? 'Take Away'
          : receiptData.order_type === 'delivery'
          ? 'Delivery'
          : 'Dine In'
      }
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-label">Payment</div>
    <div class="meta-value">
      ${
        receiptData.payment_method
          ? receiptData.payment_method.charAt(0).toUpperCase() +
            receiptData.payment_method.slice(1)
          : 'Cash'
      }
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-label">Date</div>
    <div class="meta-value">
      ${new Date(receiptData.timestamp).toLocaleString()}
    </div>
  </div>

  <div class="divider"></div>

  <div class="items-header">
    <div class="h-item">Item</div>
    <div class="h-qty">Qty</div>
    <div class="h-price">Price</div>
    <div class="h-amt">Amount</div>
  </div>

  ${itemsHtml}

  <div class="divider"></div>

  <div class="totals">

    <div class="total-row">
      <div class="total-label">Subtotal</div>
      <div class="total-value">
        Rs. ${formatCurrency(receiptData.subtotal, 0)}
      </div>
    </div>

    <div class="total-row">
      <div class="total-label">
        Tax (${Number(receiptData.tax_percent ?? orderData.tax ?? 0)}%)
      </div>
      <div class="total-value">
        Rs. ${formatCurrency(receiptData.tax, 0)}
      </div>
    </div>

    ${discountHtml}

    <div class="total-row grand-total">
      <div class="total-label">TOTAL</div>
      <div class="total-value">
        Rs. ${formatCurrency(receiptData.total, 0)}
      </div>
    </div>

  </div>

  <div class="divider solid"></div>

  <div class="footer">
    Thank you for dining with us! 
  </div>
  <div class="footer-sub">
    We hope to see you again soon!
  </div>

</body>
</html>
`;
    printWindow.document.write(printMarkup);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);
    toast.success('Receipt sent to the printer dialog');
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '#/login';
  };

  const openTodaysOrders = async () => {
    setOrdersDialogOpen(true);
    setOrdersLoading(true);
    try {
      await loadTodaysOrders();
    } catch (err) {
      console.error('Failed to fetch todays orders', err);
      toast.error('Failed to load today\'s orders');
      setTodaysOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadTodaysOrders = async () => {
    setTodaysSalesLoading(true);
    try {
      const resp = await orderAPI.getAll();
      const all = resp.data || [];
      const today = new Date();
      const isSameDay = (d1, d2) => {
        const a = new Date(d1);
        return a.getFullYear() === d2.getFullYear() && a.getMonth() === d2.getMonth() && a.getDate() === d2.getDate();
      };
      const filtered = all.filter((o) => {
        const orderTime = o.order_time || o.created_at;
        const isCompleted = String(o.status || '').toLowerCase() === 'completed';
        return orderTime && isSameDay(orderTime, today) && isCompleted;
      });
      setTodaysOrders(filtered);
    } catch (err) {
      console.error('Failed to load todays orders', err);
      setTodaysOrders([]);
    } finally {
      setTodaysSalesLoading(false);
    }
  };

  const openOrderDetails = async (order) => {
    try {
      const r = await orderItemAPI.getByOrderId(order.id);
      setOrdersSelected(order);
      setOrdersItems(r.data || []);
    } catch (err) {
      toast.error('Failed to load order details');
      setOrdersItems([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchDeals();
    loadTodaysOrders();
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
  const filteredProducts = products.filter(product =>
       {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isSizeablePizza = (product) => {
    if (!product || product.category !== 'Pizza') return false;
    return Array.isArray(product.variants) ? product.variants.length > 0 : true;
  };

  const getAvailableVariantOptions = (product) => {
    if (!product || !Array.isArray(product.variants)) return [];
    return product.variants
      .filter((variant) => Number(variant.price) > 0)
      .map((variant) => ({
        value: variant.size_name,
        label: variant.size_name,
        price: Number(variant.price || 0),
      }));
  };

  const getSizePrice = (product, size) => getProductSizePrice(product, size);

  const addDealToCart = (deal) => {
    const dealItem = {
      id: `deal-${deal.id}`,
      name: deal.name,
      price: parseFloat(deal.deal_price) || 0,
      quantity: 1,
      isDeal: true,
      dealItems: deal.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name || item.name || 'Item',
        quantity: item.quantity,
        size: item.size || null,
      })),
    };

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === dealItem.id && item.isDeal && !item._heldItem);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === dealItem.id && item.isDeal
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, dealItem];
    });

  };

  const addToCart = (product) => {
    if (isSizeablePizza(product)) {
      const availableVariants = getAvailableVariantOptions(product);
      setSelectedProduct(product);
      setSelectedSize(availableVariants[0]?.value || 'Small');
      setSizeDialog(true);
      return;
    }

    // Ice cream — open cup builder dialog
    if (product.category === 'Ice Creams') {
      // Pre-select the tapped flavour with 1 scoop
      setCupScoops({ [product.id]: 1 });
      setIceCreamDialog(true);
      return;
    }

    // For products without size options
    const price = getProductBasePrice(product);
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id && !item.size && !item._heldItem);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id && !item.size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, price, quantity: 1, size: null }];
    });
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
        item => item.id === selectedProduct.id && item.size === selectedSize && !item._heldItem
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
  };

  const handleIceCreamAdd = () => {
    const selectedFlavours = Object.entries(cupScoops).filter(([, count]) => count > 0);
    if (selectedFlavours.length === 0) return;

    // Build name and price from selected flavours
    const iceCreamProducts = products.filter(p => p.category === 'Ice Creams');
    const flavourLines = selectedFlavours.map(([id, count]) => {
      const p = iceCreamProducts.find(p => String(p.id) === String(id));
      return { name: p?.name || 'Scoop', price: getProductBasePrice(p), count };
    });

    const totalPrice = flavourLines.reduce((sum, f) => sum + f.price * f.count, 0);
    const flavourLabel = flavourLines.map(f => `${f.name} ×${f.count}`).join(', ');
    const cartName = `Ice Cream Cup (${flavourLabel})`;
    const cartKey = `cup-${selectedFlavours.map(([id, c]) => `${id}x${c}`).join('-')}`;

    setCart(prevCart => {
      const existing = prevCart.find(item => item._iceCreamKey === cartKey && !item._heldItem);
      if (existing) {
        return prevCart.map(item =>
          item._iceCreamKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, {
        id: cartKey,
        name: cartName,
        price: totalPrice,
        quantity: 1,
        size: null,
        category: 'Ice Creams',
        _iceCreamKey: cartKey,
        _isIceCream: true,
      }];
    });

    setIceCreamDialog(false);
    setCupScoops({});
  };

  const removeFromCart = (productId, size = null) => {
    setCart(prevCart => prevCart.filter(item => {
      if (item._heldItem) return true;
      return item.id !== productId || (size !== null && item.size !== size);
    }));
  };

  const updateQuantity = (productId, delta, size = null) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item._heldItem) return item;
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
  const todaysSalesTotal = todaysOrders.reduce((sum, order) => sum + Number(order.estimated_total || 0), 0);
  const taxPercentValue = Number(orderData.tax ?? 0);
  const discountPercentValue = Number(orderData.discount ?? 0);
  const taxAmount = cartTotal * (taxPercentValue / 100);
  const discountAmount = cartTotal * (discountPercentValue / 100);
  const finalTotal = cartTotal + taxAmount - discountAmount;

  const buildReceiptData = (databaseOrderId = null, existingOrderNumber = null) => {
    const nextOrderNumber = existingOrderNumber ?? orderNumberRef.current;
    if (existingOrderNumber === null || existingOrderNumber === undefined) {
      orderNumberRef.current += 1;
      // Persist the new order number with today's date so it survives refresh but resets at midnight
      localStorage.setItem('pos_order_number_data', JSON.stringify({
        number: orderNumberRef.current,
        date: new Date().toDateString(),
      }));
    }

    return {
      id: databaseOrderId,
      order_number: nextOrderNumber,
      table_no: orderData.table_no,
      waiter_name: orderData.waiter_name,
      customer_name: orderData.customer_name,
      customer_contact: orderData.customer_contact,
      customer_address: orderData.customer_address,
      items: cart,
      subtotal: cartTotal,
      tax: taxAmount,
      tax_percent: Number(orderData.tax ?? 0),
      discount: discountAmount,
      total: finalTotal,
      timestamp: new Date().toISOString(),
      order_type: orderData.order_type || 'dine_in',
      payment_method: orderData.payment_method || 'cash',
      is_completed: false,
    };
  };

  const createPendingOrder = async () => {
    const response = await orderAPI.create({
      table_no: (orderData.order_type || 'dine_in') === 'dine_in' ? Number(orderData.table_no || 0) : 0,
      waiter_name: orderData.waiter_name || 'Walk-in',
      status: 'pending',
      order_type: orderData.order_type || 'dine_in',
    });
    return response.data.order.id;
  };

  const handlePrintReceipt = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    let databaseOrderId = currentHeldOrderDatabaseId;
    let createdDatabaseOrder = false;
    try {
      if (!databaseOrderId) {
        databaseOrderId = await createPendingOrder();
        createdDatabaseOrder = true;
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create order');
      return;
    }

    const receiptData = buildReceiptData(databaseOrderId, currentHeldOrderNumber);
    setCompletedOrder(receiptData);
    const printed = await handlePrint(receiptData);

    if (printed) {
      await moveCartToHeldOrders(databaseOrderId, receiptData.order_number);
    } else {
      if (createdDatabaseOrder) {
        await orderAPI.delete(databaseOrderId).catch(() => {});
      }
    }
  };

  const moveCartToHeldOrders = async (databaseOrderId = null, orderNumber = null) => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return false;
    }

    const validationError = getOrderValidationError();
    if (validationError) {
      toast.error(validationError);
      return false;
    }

    let reservedOrderId = databaseOrderId;
    if (!reservedOrderId) {
      reservedOrderId = await createPendingOrder();
    }

    let heldOrderNumber = orderNumber;
    if (heldOrderNumber === null || heldOrderNumber === undefined) {
      heldOrderNumber = orderNumberRef.current;
      orderNumberRef.current += 1;
      localStorage.setItem('pos_order_number_data', JSON.stringify({
        number: orderNumberRef.current,
        date: new Date().toDateString(),
      }));
    }

    const heldOrder = {
      id: Date.now(),
      database_order_id: reservedOrderId,
      order_number: heldOrderNumber,
      table_no: orderData.table_no,
      waiter_name: orderData.waiter_name,
      customer_name: orderData.customer_name,
      customer_contact: orderData.customer_contact,
      customer_address: orderData.customer_address,
      items: cart.map(item => ({ ...item, _heldItem: true })),
      tax: orderData.tax,
      discount: orderData.discount,
      order_type: orderData.order_type || 'dine_in',
      category: getOrderTypeLabel(orderData.order_type || 'dine_in'),
      payment_method: orderData.payment_method || 'cash',
      timestamp: new Date().toISOString(),
      local: true,
    };

    setHeldOrders(prev => [...prev, heldOrder]);
    setCart([]);
    setOrderData({ ...defaultOrderData });
    setCurrentHeldOrderId(null);
    setCurrentHeldOrderDatabaseId(null);
    setCurrentHeldOrderNumber(null);
    setCheckoutDialog(false);
    toast.success('Order held successfully');
    return true;
  };

  const holdOrder = async () => {
    try {
      await moveCartToHeldOrders(currentHeldOrderDatabaseId, currentHeldOrderNumber);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to hold order');
    }
  };

  const resumeOrder = (heldOrder) => {
    setCart(heldOrder.items.map(item => ({ ...item, _heldItem: true })));
    setOrderData({
      ...defaultOrderData,
      table_no: heldOrder.table_no || '',
      waiter_name: heldOrder.waiter_name || '',
      customer_name: heldOrder.customer_name || '',
      customer_contact: heldOrder.customer_contact || '',
      customer_address: heldOrder.customer_address || '',
      tax: heldOrder.tax ?? 0,
      discount: heldOrder.discount ?? 0,
      order_type: heldOrder.order_type || 'dine_in',
      payment_method: heldOrder.payment_method || 'cash',
    });
    setHeldOrders(heldOrders.filter(o => o.id !== heldOrder.id));
    setCurrentHeldOrderId(heldOrder.id);
    setCurrentHeldOrderDatabaseId(heldOrder.database_order_id || null);
    setCurrentHeldOrderNumber(heldOrder.order_number ?? null);
    setCheckoutDialog(false);
    toast.success('Order resumed. Add more products from the menu and then view order to complete it.');
  };

  const openCancelDialog = (order) => {
    setCancelCandidate(order);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const deleteHeldOrder = async () => {
    if (!cancelCandidate) return;
    if (!cancelReason.trim()) {
      toast.error('Cancellation reason is required');
      return;
    }

    const candidateId = typeof cancelCandidate.id === 'string' ? parseInt(cancelCandidate.id, 10) : cancelCandidate.id;
    const isLocalHeldOrder = cancelCandidate.local === true
      || (Number.isFinite(candidateId) && candidateId > 2147483647);

    try {
      if (cancelCandidate.database_order_id) {
        await orderAPI.cancel(cancelCandidate.database_order_id, cancelReason.trim());
      } else if (isLocalHeldOrder) {
        const response = await orderAPI.create({
          table_no: (cancelCandidate.order_type || 'dine_in') === 'dine_in' ? Number(cancelCandidate.table_no || 0) : 0,
          waiter_name: cancelCandidate.waiter_name || 'Walk-in',
          status: 'pending',
          order_type: cancelCandidate.order_type || 'dine_in',
        });

        const orderId = response.data.order.id;
        const heldItems = Array.isArray(cancelCandidate.items) ? cancelCandidate.items : [];
        for (const item of heldItems) {
          if (item.isDeal && Array.isArray(item.dealItems) && item.dealItems.length > 0) {
            await orderItemAPI.create({
              order_id: orderId,
              product_id: item.dealItems[0]?.product_id || item.id,
              quantity: item.quantity,
              unit_price: Number(item.price || 0),
              item_name: item.name,
              is_deal: true,
              deal_name: item.name,
            });
            continue;
          }

          if (item._isIceCream && item._iceCreamKey) {
            const keyBody = item._iceCreamKey.replace(/^cup-/, '');
            const firstSegment = keyBody.split('-')[0];
            const primaryProductId = parseInt(firstSegment.split('x')[0], 10);
            await orderItemAPI.create({
              order_id: orderId,
              product_id: Number.isFinite(primaryProductId) ? primaryProductId : item.id,
              quantity: item.quantity,
              unit_price: Number(item.price || 0),
              size: null,
              item_name: item.name,
              is_deal: false,
              deal_name: null,
            });
            continue;
          }

          await orderItemAPI.create({
            order_id: orderId,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: Number(item.price || 0),
            size: item.size || null,
            item_name: getItemDisplayName(item),
            is_deal: false,
            deal_name: null,
          });
        }

        await orderAPI.cancel(orderId, cancelReason.trim());
      } else {
        await orderAPI.cancel(candidateId, cancelReason.trim());
      }

      setHeldOrders(prev => prev.filter(o => o.id !== cancelCandidate.id));
      if (currentHeldOrderId === cancelCandidate.id) {
        setCurrentHeldOrderId(null);
        setCurrentHeldOrderDatabaseId(null);
        setCurrentHeldOrderNumber(null);
      }
      setCancelDialogOpen(false);
      setCancelCandidate(null);
      toast.success('Held order cancelled');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel held order');
    }
  };

  // Complete a single held order directly to the database (without loading it into cart)
  const completeHeldOrder = async (heldOrder) => {
    try {
      const heldItems = heldOrder.items;
      const heldSubtotal = heldItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const heldTax = heldSubtotal * ((heldOrder.tax ?? 0) / 100);
      const heldDiscount = heldSubtotal * ((heldOrder.discount ?? 0) / 100);
      const heldTotal = heldSubtotal + heldTax - heldDiscount;

      let orderId = heldOrder.database_order_id;
      if (!orderId) {
        const orderResponse = await orderAPI.create({
          table_no: (heldOrder.order_type || 'dine_in') === 'dine_in' ? Number(heldOrder.table_no || 0) : 0,
          waiter_name: heldOrder.waiter_name || 'Walk-in',
          status: 'pending',
          order_type: heldOrder.order_type || 'dine_in',
        });
        orderId = orderResponse.data.order.id;
      }

      for (const item of heldItems) {
        if (item.isDeal && Array.isArray(item.dealItems) && item.dealItems.length > 0) {
          await orderItemAPI.create({ order_id: orderId, product_id: item.dealItems[0]?.product_id || item.id, quantity: item.quantity, unit_price: Number(item.price || 0), item_name: item.name, is_deal: true, deal_name: item.name });
          continue;
        }
        if (item._isIceCream && item._iceCreamKey) {
          const keyBody = item._iceCreamKey.replace(/^cup-/, '');
          const primaryProductId = parseInt(keyBody.split('-')[0].split('x')[0], 10);
          await orderItemAPI.create({ order_id: orderId, product_id: primaryProductId, quantity: item.quantity, unit_price: Number(item.price || 0), size: null, item_name: item.name, is_deal: false, deal_name: null });
          continue;
        }
        await orderItemAPI.create({ order_id: orderId, product_id: item.id, quantity: item.quantity, unit_price: Number(item.price || 0), size: item.size || null, item_name: getItemDisplayName(item), is_deal: false, deal_name: null });
      }

      await billingAPI.create({ order_id: orderId, subtotal: heldSubtotal, tax: heldTax, discount: heldDiscount, total: heldTotal, payment_method: heldOrder.payment_method || 'cash' });
      await orderAPI.updateStatus(orderId, 'completed');

      // Remove from held orders
      setHeldOrders(prev => prev.filter(o => o.id !== heldOrder.id));
      if (currentHeldOrderId === heldOrder.id) setCurrentHeldOrderId(null);
      return true;
    } catch (err) {
      console.error('completeHeldOrder error:', err);
      throw err;
    }
  };

  const payAllHeldOrders = async (filteredList) => {
    if (filteredList.length === 0) { toast.error('No orders to pay'); return; }
    if (!window.confirm(`Mark all ${filteredList.length} held order(s) as paid and complete them?`)) return;
    let success = 0;
    let failed = 0;
    for (const heldOrder of filteredList) {
      try { await completeHeldOrder(heldOrder); success++; }
      catch { failed++; }
    }
    if (success > 0) toast.success(`${success} order(s) completed successfully`);
    if (failed > 0) toast.error(`${failed} order(s) failed`);
  };

  const clearCart = () => {
    const heldItems = cart.filter(item => item._heldItem);
    if (heldItems.length > 0) {
      const newItems = cart.filter(item => !item._heldItem);
      if (newItems.length === 0) {
        toast.info('Previously printed items cannot be cleared');
        return;
      }
      setCart(heldItems);
      toast.success('New items cleared; previously printed items preserved');
      return;
    }

    setCurrentHeldOrderId(null);
    setCurrentHeldOrderDatabaseId(null);
    setCurrentHeldOrderNumber(null);
    setCart([]);
    setOrderData({ ...defaultOrderData });
    localStorage.removeItem('pos_cart');
    localStorage.removeItem('pos_order_data');
    toast.success('Cart cleared');
  };

  const handleStartShift = async () => {
    try {
      setShiftLoading(true);
      const response = await shiftAPI.start({ opening_cash: Number(shiftOpeningCash || 0) });
      setActiveShift(response.data.shift);
      setShiftDialogOpen(false);
      toast.success('Shift started');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start shift');
    } finally {
      setShiftLoading(false);
    }
  };

  const handleCloseShift = async () => {
    try {
      setShiftLoading(true);
      const response = await shiftAPI.close({ closing_cash: Number(shiftClosingCash || 0), expected_cash: Number(shiftOpeningCash || 0) });
      setActiveShift(response.data.shift);
      setShiftDialogOpen(false);
      toast.success('Shift closed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to close shift');
    } finally {
      setShiftLoading(false);
    }
  };

  const completeOrder = async () => {
    if (!activeShift && !window.confirm('No active shift found. Continue anyway?')) {
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const validationError = getOrderValidationError();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      let orderId = currentHeldOrderDatabaseId;
      if (!orderId) {
        const orderResponse = await orderAPI.create({
          table_no: (orderData.order_type || 'dine_in') === 'dine_in' ? Number(orderData.table_no || 0) : 0,
          waiter_name: orderData.waiter_name || 'Walk-in',
          status: 'pending',
          order_type: orderData.order_type || 'dine_in',
        });
        orderId = orderResponse.data.order.id;
      }

      for (const item of cart) {
        if (item.isDeal && Array.isArray(item.dealItems) && item.dealItems.length > 0) {
          await orderItemAPI.create({
            order_id: orderId,
            product_id: item.dealItems[0]?.product_id || item.id,
            quantity: item.quantity,
            unit_price: Number(item.price || 0),
            item_name: item.name,
            is_deal: true,
            deal_name: item.name,
          });
          continue;
        }

        // Ice cream cups have a composite string id like "cup-53x1-72x2".
        // Extract the first real product ID from the _iceCreamKey so we pass
        // a valid integer to the backend.
        if (item._isIceCream && item._iceCreamKey) {
          // _iceCreamKey format: "cup-{id}x{count}-{id}x{count}-..."
          const keyBody = item._iceCreamKey.replace(/^cup-/, '');
          const firstSegment = keyBody.split('-')[0]; // e.g. "53x1"
          const primaryProductId = parseInt(firstSegment.split('x')[0], 10);

          await orderItemAPI.create({
            order_id: orderId,
            product_id: primaryProductId,
            quantity: item.quantity,
            unit_price: Number(item.price || 0),
            size: null,
            item_name: item.name, // full label, e.g. "Ice Cream Cup (Vanilla ×1, Chocolate ×2)"
            is_deal: false,
            deal_name: null,
          });
          continue;
        }

        await orderItemAPI.create({
          order_id: orderId,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: Number(item.price || 0),
          size: item.size || null,
          item_name: getItemDisplayName(item),
          is_deal: false,
          deal_name: null,
        });
      }

      // Create billing record
      await billingAPI.create({
        order_id: orderId,
        subtotal: cartTotal,
        tax: taxAmount,
        discount: discountAmount,
        total: finalTotal,
        payment_method: orderData.payment_method || 'cash',
      });
      await orderAPI.updateStatus(orderId, 'completed');

      setCompletedOrder(buildReceiptData(orderId, currentHeldOrderNumber));

      // Clear localStorage after successful order completion
      localStorage.removeItem('pos_cart');
      localStorage.removeItem('pos_order_data');

      setCart([]);
      setCheckoutDialog(false);
      setOrderData({ ...defaultOrderData });
      setCurrentHeldOrderId(null);
      setCurrentHeldOrderDatabaseId(null);
      setCurrentHeldOrderNumber(null);
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
          <Button
            variant={activeShift ? 'contained' : 'outlined'}
            color={activeShift ? 'success' : 'inherit'}
            startIcon={activeShift ? <Pause /> : <PlayArrow />}
            onClick={() => setShiftDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 700, ml: 1 }}
          >
            {activeShift ? 'Close Shift' : 'Start Shift'}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setHeldOrdersDialog(true)}
            sx={{ textTransform: 'none', fontWeight: 700, ml: 1 }}
          >
            <Badge badgeContent={heldOrders.length} color="warning" sx={{ mr: 1 }}>
              <Pause />
            </Badge>
            Held Orders
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<History />}
            onClick={openTodaysOrders}
            sx={{ textTransform: 'none', fontWeight: 700, ml: 1 }}
          >
            Today's Orders
          </Button>
          <IconButton color="inherit" onClick={logout} sx={{ ml: 1 }}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: 'flex-start' }}>
          <Box sx={{ width: { xs: '100%', lg: 280 }, flexShrink: 0 }}>
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 14px 35px rgba(15,23,42,0.06)', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Today's Sales
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Rs. {formatCurrency(todaysSalesTotal)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total sales for today
                  </Typography>
                </Box>
                <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: '#e0f2fe', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Receipt sx={{ color: '#0284c7', fontSize: 28 }} />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {todaysOrders.length} completed order{todaysOrders.length !== 1 ? 's' : ''}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 14px 35px rgba(15,23,42,0.06)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Categories
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'contained' : 'outlined'}
                    onClick={() => setSelectedCategory(category)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      bgcolor: selectedCategory === category ? categoryColors[category] || '#1976d2' : 'transparent',
                      color: selectedCategory === category ? 'white' : 'text.primary',
                      borderColor: 'rgba(15,23,42,0.08)',
                      '&:hover': {
                        bgcolor: selectedCategory === category ? categoryColors[category] || '#1976d2' : '#eef2ff',
                      },
                    }}
                  >
                    {category}
                  </Button>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Deals
              </Typography>
              {activeDeals.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {activeDeals.map((deal) => (
                    <Paper key={deal.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(15,23,42,0.08)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {deal.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {deal.items.slice(0, 2).map((item) => `${item.product_name || 'Item'} x${item.quantity}`).join(', ')}
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                        Rs. {formatCurrency(deal.deal_price)}
                      </Typography>
                      <Button variant="contained" size="small" fullWidth onClick={() => addDealToCart(deal)} sx={{ textTransform: 'none' }}>
                        Add Deal
                      </Button>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active deals right now.
                </Typography>
              )}
            </Paper>
          </Box>

          <Box sx={{ flex: 1, width: '100%' }}>
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 4, boxShadow: '0 14px 35px rgba(15,23,42,0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
            </Box>

            <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
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
                          Rs. {formatCurrency(getProductBasePrice(product), 0)}
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
          </Box>
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
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Order Type</InputLabel>
                  <Select
                    value={orderData.order_type || 'dine_in'}
                    label="Order Type"
                    onChange={(e) => setOrderData({ ...orderData, order_type: e.target.value })}
                  >
                    <MenuItem value="dine_in">Dine In</MenuItem>
                    <MenuItem value="take_away">Take Away</MenuItem>
                    <MenuItem value="delivery">Delivery</MenuItem>
                  </Select>
                </FormControl>
                {(orderData.order_type || 'dine_in') === 'dine_in' ? (
                  <>
                    <TextField
                      fullWidth
                      select
                      label="Table Number"
                      value={orderData.table_no}
                      onChange={(e) => setOrderData({ ...orderData, table_no: e.target.value })}
                      sx={{ mb: 2 }}
                    >
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((table) => (
                        <MenuItem key={table} value={String(table)}>
                          Table {table}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      label="Waiter Name"
                      value={orderData.waiter_name}
                      onChange={(e) => setOrderData({ ...orderData, waiter_name: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      fullWidth
                      label="Customer Name"
                      value={orderData.customer_name}
                      onChange={(e) => setOrderData({ ...orderData, customer_name: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Contact Number"
                      value={orderData.customer_contact}
                      onChange={(e) => setOrderData({ ...orderData, customer_contact: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    {(orderData.order_type || 'dine_in') === 'delivery' && (
                      <TextField
                        fullWidth
                        label="Delivery Address"
                        multiline
                        rows={3}
                        value={orderData.customer_address}
                        onChange={(e) => setOrderData({ ...orderData, customer_address: e.target.value })}
                        sx={{ mb: 2 }}
                      />
                    )}
                  </>
                )}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={orderData.payment_method || 'cash'}
                    label="Payment Method"
                    onChange={(e) => setOrderData({ ...orderData, payment_method: e.target.value })}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="online">Online</MenuItem>
                  </Select>
                </FormControl>
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
                        <Button size="small" variant="outlined" disabled={item._heldItem} onClick={() => updateQuantity(item.id, -1, item.size)} sx={{ minWidth: 32, p: 0.5 }}>
                          <Remove fontSize="small" />
                        </Button>
                        <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <Button size="small" variant="outlined" disabled={item._heldItem} onClick={() => updateQuantity(item.id, 1, item.size)} sx={{ minWidth: 32, p: 0.5 }}>
                          <Add fontSize="small" />
                        </Button>
                      </Box>
                      <Typography variant="subtitle2" sx={{ minWidth: 80, textAlign: 'right' }}>
                        Rs. {formatCurrency(item.price * item.quantity)}
                      </Typography>
                      <IconButton size="small" color="error" disabled={item._heldItem} onClick={() => removeFromCart(item.id, item.size)}>
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
                  variant="outlined"
                  size="large"
                  onClick={handlePrintReceipt}
                  disabled={cart.length === 0}
                  sx={{ mt: 3, py: 1.5, textTransform: 'none', fontWeight: 700 }}
                  startIcon={<Print />}
                >
                  Print Receipt
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={completeOrder}
                  disabled={cart.length === 0}
                  sx={{ mt: 2, py: 1.5, textTransform: 'none', fontWeight: 700 }}
                  startIcon={<Receipt />}
                >
                  Complete Order
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

      {/* Held Orders Dialog - Premium Commercial POS Design */}
      <Dialog
        open={heldOrdersDialog}
        onClose={() => setHeldOrdersDialog(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 0,
            minHeight: '95vh',
            maxHeight: '95vh',
            bgcolor: '#fafafa',
            m: 0
          } 
        }}
      >
        {/* Premium Header */}
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 10 }}>
          <Box sx={{ px: 4, py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, letterSpacing: '-0.5px' }}>
                  Held Orders
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Manage and resume pending orders
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => { /* Refresh logic */ }}
                  sx={{
                    borderColor: '#e0e0e0',
                    color: '#666',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2,
                    '&:hover': { borderColor: '#ff6b35', bgcolor: '#fff5f2', color: '#ff6b35' }
                  }}
                >
                  Refresh
                </Button>
                <IconButton
                  onClick={() => setHeldOrdersDialog(false)}
                  sx={{
                    color: '#666',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
              {[
                { label: 'Held Orders', value: heldOrders.length, color: '#ff6b35', icon: Pause },
                { 
                  label: 'Total Value', 
                  value: `Rs. ${formatCurrency(heldOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0), 0)}`,
                  color: '#10b981',
                  icon: Receipt
                },
                { 
                  label: 'Average Ticket', 
                  value: heldOrders.length > 0 ? `Rs. ${formatCurrency(heldOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0) / heldOrders.length, 0)}` : 'Rs. 0',
                  color: '#3b82f6',
                  icon: Restaurant
                },
                { 
                  label: 'Oldest Order', 
                  value: heldOrders.length > 0 ? (() => {
                    const oldest = new Date(Math.min(...heldOrders.map(o => new Date(o.timestamp))));
                    const mins = Math.floor((Date.now() - oldest) / 60000);
                    return `${mins} min${mins !== 1 ? 's' : ''}`;
                  })() : 'N/A',
                  color: '#f59e0b',
                  icon: History
                }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <Paper key={idx} elevation={0} sx={{ p: 2.5, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon sx={{ fontSize: 20, color: stat.color }} />
                      </Box>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                      {stat.label}
                    </Typography>
                  </Paper>
                );
              })}
            </Box>

            {/* Search and Filters */}
            {/* Search and Filters */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search by order #, customer, table, waiter..."
                value={heldOrdersSearch}
                onChange={e => setHeldOrdersSearch(e.target.value)}
                size="small"
                InputProps={{ 
                  startAdornment: <Search sx={{ mr: 1, color: '#999', fontSize: 20 }} /> 
                }}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    borderRadius: 2,
                    '& fieldset': { borderColor: '#e0e0e0' },
                    '&:hover fieldset': { borderColor: '#ff6b35' },
                    '&.Mui-focused fieldset': { borderColor: '#ff6b35', borderWidth: 1 },
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { value: 'all', label: 'All' },
                  { value: 'dine_in', label: 'Dine In' },
                  { value: 'take_away', label: 'Take Away' },
                  { value: 'delivery', label: 'Delivery' },
                ].map(opt => {
                  const count = opt.value === 'all' ? heldOrders.length : heldOrders.filter(o => o.order_type === opt.value).length;
                  const isActive = heldOrdersFilter === opt.value;
                  return (
                    <Button
                      key={opt.value}
                      size="small"
                      onClick={() => setHeldOrdersFilter(opt.value)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 2,
                        py: 0.75,
                        bgcolor: isActive ? '#ff6b35' : '#fff',
                        color: isActive ? '#fff' : '#666',
                        border: '1px solid',
                        borderColor: isActive ? '#ff6b35' : '#e0e0e0',
                        '&:hover': {
                          bgcolor: isActive ? '#e55a2b' : '#fff5f2',
                          borderColor: isActive ? '#e55a2b' : '#ff6b35',
                          color: isActive ? '#fff' : '#ff6b35'
                        }
                      }}
                    >
                      {opt.label}
                      <Box
                        component="span"
                        sx={{
                          ml: 1,
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: isActive ? 'rgba(255,255,255,0.2)' : '#f5f5f5',
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      >
                        {count}
                      </Box>
                    </Button>
                  );
                })}

                {/* Time sort toggle */}
                <Button
                  size="small"
                  onClick={() => setHeldOrdersSort(s => s === 'newest' ? 'oldest' : 'newest')}
                  startIcon={<History sx={{ fontSize: 16 }} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2,
                    py: 0.75,
                    bgcolor: '#fff',
                    color: '#1565c0',
                    border: '1px solid #bbdefb',
                    '&:hover': { bgcolor: '#e3f2fd', borderColor: '#1976d2' }
                  }}
                >
                  {heldOrdersSort === 'newest' ? 'Newest First' : 'Oldest First'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Content Area */}
        <DialogContent sx={{ p: 0, bgcolor: '#fafafa', overflow: 'auto' }}>
          <Box sx={{ p: 3 }}>
            {(() => {
              const filtered = heldOrders.filter(o => {
                const matchesType = heldOrdersFilter === 'all' || o.order_type === heldOrdersFilter;
                const q = heldOrdersSearch.toLowerCase();
                const matchesSearch = !q || (
                  String(o.order_number || o.id).includes(q) ||
                  String(o.table_no || '').toLowerCase().includes(q) ||
                  String(o.customer_name || '').toLowerCase().includes(q) ||
                  String(o.customer_contact || '').toLowerCase().includes(q) ||
                  String(o.waiter_name || '').toLowerCase().includes(q)
                );
                return matchesType && matchesSearch;
              });

              if (filtered.length === 0) {
                return (
                  <Paper elevation={0} sx={{ py: 10, textAlign: 'center', bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#fff5f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 3, border: '2px solid #ffe5dc' }}>
                      <Pause sx={{ fontSize: 36, color: '#ff6b35' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                      {heldOrders.length === 0 ? 'No Held Orders' : 'No Matching Orders'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#999', maxWidth: 400, mx: 'auto' }}>
                      {heldOrders.length === 0
                        ? 'Hold orders from the cart to keep your workflow organized and efficient.'
                        : 'No orders match your current search or filter criteria. Try adjusting your search.'}
                    </Typography>
                  </Paper>
                );
              }

              // Sort by time
              const sorted = [...filtered].sort((a, b) => {
                const diff = new Date(a.timestamp) - new Date(b.timestamp);
                return heldOrdersSort === 'newest' ? -diff : diff;
              });

              return (
                <>
                  {/* Pay All bar */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827' }}>
                      {sorted.length} order{sorted.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                      <span style={{ color: '#10b981' }}>
                        Rs. {formatCurrency(sorted.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.price * i.quantity, 0), 0), 0)} total
                      </span>
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={sorted.length === 0}
                      onClick={() => payAllHeldOrders(sorted)}
                      sx={{
                        textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
                        bgcolor: '#10b981', boxShadow: 'none',
                        '&:hover': { bgcolor: '#059669', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' },
                        '&:disabled': { bgcolor: '#d1fae5', color: '#6ee7b7' }
                      }}
                    >
                      ✓ Pay All Orders
                    </Button>
                  </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 1.5 }}>
                  {sorted.map(heldOrder => {
                    const subtotal = heldOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
                    const isActive = currentHeldOrderId === heldOrder.id;
                    const typeConfig = {
                      dine_in:  { color: '#3b82f6', bg: '#eff6ff',  label: 'Dine In',   icon: Restaurant },
                      take_away:{ color: '#f59e0b', bg: '#fef3c7',  label: 'Take Away', icon: Fastfood   },
                      delivery: { color: '#10b981', bg: '#d1fae5',  label: 'Delivery',  icon: LocalPizza },
                    };
                    const cfg = typeConfig[heldOrder.order_type] || typeConfig.dine_in;
                    const TypeIcon = cfg.icon;

                    return (
                      <Paper key={heldOrder.id} elevation={0} sx={{
                        borderRadius: 2,
                        border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        bgcolor: '#ffffff',
                        overflow: 'hidden',
                        transition: 'all 0.18s ease',
                        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' },
                      }}>
                        {/* Card Header */}
                        <Box sx={{ bgcolor: isActive ? '#eff6ff' : '#f9fafb', borderBottom: '1px solid #e5e7eb', px: 2, py: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight={700} sx={{ color: '#111827', fontSize: 15 }}>
                              #{heldOrder.database_order_id || heldOrder.order_number || String(heldOrder.id).slice(-4)}
                            </Typography>
                            <Chip
                              icon={<TypeIcon sx={{ fontSize: '13px !important' }} />}
                              label={cfg.label}
                              size="small"
                              sx={{ height: 20, fontWeight: 600, fontSize: 10, bgcolor: cfg.bg, color: cfg.color, border: 'none', '& .MuiChip-icon': { color: cfg.color } }}
                            />
                            {isActive && (
                              <Chip label="EDITING" size="small" sx={{ height: 18, fontWeight: 700, fontSize: 9, bgcolor: '#3b82f6', color: '#fff' }} />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.2 }}>
                            <Typography fontWeight={700} sx={{ color: '#3b82f6', fontSize: 14 }}>
                              Rs. {formatCurrency(subtotal, 0)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <History sx={{ fontSize: 11, color: (() => { const mins = Math.floor((Date.now() - new Date(heldOrder.timestamp)) / 60000); return mins > 30 ? '#dc2626' : mins > 15 ? '#f59e0b' : '#9ca3af'; })() }} />
                              <Typography variant="caption" sx={{ color: (() => { const mins = Math.floor((Date.now() - new Date(heldOrder.timestamp)) / 60000); return mins > 30 ? '#dc2626' : mins > 15 ? '#f59e0b' : '#6b7280'; })(), fontWeight: 600, fontSize: 11 }}>
                                {new Date(heldOrder.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' · '}
                                {(() => { const mins = Math.floor((Date.now() - new Date(heldOrder.timestamp)) / 60000); return mins < 1 ? 'just now' : `${mins}m ago`; })()}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ px: 2, py: 1.5 }}>
                          {/* Context info row — smart by order type */}
                          <Box sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
                            {heldOrder.order_type === 'dine_in' && <>
                              {heldOrder.table_no && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>Table</Typography>
                                  <Typography variant="body2" fontWeight={700} sx={{ color: '#111827', fontSize: 13 }}>{heldOrder.table_no}</Typography>
                                </Box>
                              )}
                              {heldOrder.waiter_name && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>Waiter</Typography>
                                  <Typography variant="body2" fontWeight={700} sx={{ color: '#111827', fontSize: 13 }}>{heldOrder.waiter_name}</Typography>
                                </Box>
                              )}
                            </>}
                            {heldOrder.order_type === 'take_away' && <>
                              {heldOrder.customer_name && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>Customer</Typography>
                                  <Typography variant="body2" fontWeight={700} sx={{ color: '#111827', fontSize: 13 }}>{heldOrder.customer_name}</Typography>
                                </Box>
                              )}
                            </>}
                            {heldOrder.order_type === 'delivery' && <>
                              {heldOrder.customer_name && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>Name</Typography>
                                  <Typography variant="body2" fontWeight={700} sx={{ color: '#111827', fontSize: 13 }}>{heldOrder.customer_name}</Typography>
                                </Box>
                              )}
                              {heldOrder.customer_contact && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>Phone</Typography>
                                  <Typography variant="body2" fontWeight={700} sx={{ color: '#111827', fontSize: 13 }}>{heldOrder.customer_contact}</Typography>
                                </Box>
                              )}
                            </>}
                            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>Items</Typography>
                              <Typography variant="body2" fontWeight={700} sx={{ color: '#111827', fontSize: 13 }}>{heldOrder.items.length}</Typography>
                            </Box>
                          </Box>

                          {/* Items chips */}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                            {heldOrder.items.slice(0, 4).map((item, idx) => (
                              <Chip key={idx} size="small"
                                label={`${item.name}${item.size ? ` (${item.size.charAt(0).toUpperCase() + item.size.slice(1)})` : ''} ×${item.quantity}`}
                                sx={{ fontSize: 11, height: 22, fontWeight: 500, bgcolor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}
                              />
                            ))}
                            {heldOrder.items.length > 4 && (
                              <Chip size="small" label={`+${heldOrder.items.length - 4} more`}
                                sx={{ fontSize: 11, height: 22, fontWeight: 600, bgcolor: '#1f2937', color: '#fff' }}
                              />
                            )}
                          </Box>

                          {/* Actions */}
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="outlined" startIcon={<Delete sx={{ fontSize: 16 }} />}
                              onClick={() => openCancelDialog(heldOrder)}
                              size="small"
                              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, px: 1.5, borderColor: '#fecaca', color: '#dc2626', '&:hover': { borderColor: '#dc2626', bgcolor: '#fef2f2', boxShadow: 'none' }, boxShadow: 'none' }}
                            >
                              Delete
                            </Button>
                            <Button variant="contained" startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
                              onClick={() => { resumeOrder(heldOrder); setHeldOrdersDialog(false); }}
                              size="small"
                              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#3b82f6', boxShadow: 'none', flex: 1, '&:hover': { bgcolor: '#2563eb', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' } }}
                            >
                              {isActive ? 'Continue' : 'Resume'}
                            </Button>
                            <Button variant="contained"
                              onClick={async () => {
                                try {
                                  await completeHeldOrder(heldOrder);
                                  toast.success(`Order #${heldOrder.database_order_id || heldOrder.order_number || String(heldOrder.id).slice(-4)} paid ✓`);
                                } catch {
                                  toast.error('Failed to complete order');
                                }
                              }}
                              size="small"
                              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, bgcolor: '#10b981', boxShadow: 'none', px: 2, '&:hover': { bgcolor: '#059669', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' } }}
                            >
                              Pay
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
                </>
              );
            })()}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Today's Orders Dialog */}
      <Dialog open={ordersDialogOpen} onClose={() => { setOrdersDialogOpen(false); setOrdersItems([]); setOrdersSelected(null); }} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Today's Orders</Typography>
            <IconButton onClick={() => { setOrdersDialogOpen(false); setOrdersItems([]); setOrdersSelected(null); }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {ordersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {todaysOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No orders for today</Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Waiter</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {todaysOrders.map((o) => (
                        <TableRow key={o.id} hover>
                          <TableCell>#{o.id}</TableCell>
                          <TableCell>{o.order_type === 'take_away' ? 'Take Away' : o.order_type === 'delivery' ? 'Delivery' : 'Dine In'}</TableCell>
                          <TableCell>{o.waiter_name}</TableCell>
                          <TableCell>{o.status}</TableCell>
                          <TableCell>{new Date(o.order_time).toLocaleTimeString()}</TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => openOrderDetails(o)}>View</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {ordersSelected && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Order #{ordersSelected.id} Details</Typography>
                  <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ordersItems.length === 0 ? (
                          <TableRow><TableCell colSpan={4} align="center">No items</TableCell></TableRow>
                        ) : (
                          ordersItems.map(it => (
                            <TableRow key={it.id}>
                              <TableCell>{it.item_name || it.product_name || `Product ${it.product_id}`}</TableCell>
                              <TableCell>{it.quantity}</TableCell>
                              <TableCell>Rs. {Number(it.unit_price || it.price || 0).toFixed(2)}</TableCell>
                              <TableCell>Rs. {(Number(it.unit_price || it.price || 0) * Number(it.quantity || 1)).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOrdersDialogOpen(false); setOrdersItems([]); setOrdersSelected(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Ice Cream Cup Builder Dialog */}
      <Dialog open={iceCreamDialog} onClose={() => { setIceCreamDialog(false); setCupScoops({}); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #f0f0f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Build Your Ice Cream Cup</Typography>
              <Typography variant="body2" color="text.secondary">Add scoops of your favourite flavours</Typography>
            </Box>
            <IconButton onClick={() => { setIceCreamDialog(false); setCupScoops({}); }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Flavour list from DB */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {products.filter(p => p.category === 'Ice Creams').map(flavour => {
              const scoops = cupScoops[flavour.id] || 0;
              const price = getProductBasePrice(flavour);
              return (
                <Box key={flavour.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 2, border: scoops > 0 ? '1.5px solid #1d4ed8' : '1px solid #e5e7eb', bgcolor: scoops > 0 ? '#eff6ff' : '#fff', transition: 'all 0.15s' }}>
                  <Box>
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#111827' }}>{flavour.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>Rs. {formatCurrency(price, 0)} / scoop</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {scoops > 0 && (
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#1d4ed8', minWidth: 50, textAlign: 'right' }}>
                        Rs. {formatCurrency(price * scoops, 0)}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton size="small" disabled={scoops === 0}
                        onClick={() => setCupScoops(prev => ({ ...prev, [flavour.id]: Math.max(0, (prev[flavour.id] || 0) - 1) }))}
                        sx={{ border: '1px solid #e5e7eb', borderRadius: 1.5, p: 0.5, '&:not(:disabled):hover': { borderColor: '#1d4ed8' } }}
                      >
                        <Remove sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography variant="body1" fontWeight={700} sx={{ minWidth: 24, textAlign: 'center', color: scoops > 0 ? '#1d4ed8' : '#9ca3af' }}>
                        {scoops}
                      </Typography>
                      <IconButton size="small"
                        onClick={() => setCupScoops(prev => ({ ...prev, [flavour.id]: (prev[flavour.id] || 0) + 1 }))}
                        sx={{ border: '1px solid #e5e7eb', borderRadius: 1.5, p: 0.5, '&:hover': { borderColor: '#1d4ed8', bgcolor: '#eff6ff' } }}
                      >
                        <Add sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Total */}
          {Object.values(cupScoops).some(v => v > 0) && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#1d4ed8', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {Object.entries(cupScoops).filter(([,v]) => v > 0).reduce((s, [,v]) => s + v, 0)} scoop{Object.entries(cupScoops).filter(([,v]) => v > 0).reduce((s, [,v]) => s + v, 0) !== 1 ? 's' : ''} selected
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                  {Object.entries(cupScoops).filter(([,v]) => v > 0).map(([id, v]) => {
                    const p = products.find(p => String(p.id) === String(id));
                    return `${p?.name} ×${v}`;
                  }).join(' · ')}
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
                Rs. {formatCurrency(
                  Object.entries(cupScoops).filter(([,v]) => v > 0).reduce((sum, [id, v]) => {
                    const p = products.find(p => String(p.id) === String(id));
                    return sum + getProductBasePrice(p) * v;
                  }, 0), 0)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setIceCreamDialog(false); setCupScoops({}); }} sx={{ textTransform: 'none', color: '#6b7280' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleIceCreamAdd}
            disabled={!Object.values(cupScoops).some(v => v > 0)}
            sx={{ textTransform: 'none', fontWeight: 700, px: 3, bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}
          >
            Add to Cart
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
                  {getAvailableVariantOptions(selectedProduct).map((variant) => (
                    <MenuItem key={variant.value} value={variant.value}>
                      {variant.label} - Rs. {formatCurrency(getSizePrice(selectedProduct, variant.value), 0)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSizeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSizeSelection}>Add to Cart</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel held order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter a cancellation reason before confirming.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Cancellation reason"
            multiline
            minRows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={deleteHeldOrder}>Confirm Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={shiftDialogOpen} onClose={() => setShiftDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{activeShift ? 'Close Shift' : 'Start Shift'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {activeShift ? 'Record the closing cash for the current business shift.' : 'Start a new business shift for today.'}
          </Typography>
          <TextField
            fullWidth
            label={activeShift ? 'Closing cash' : 'Opening cash'}
            type="number"
            value={activeShift ? shiftClosingCash : shiftOpeningCash}
            onChange={(e) => activeShift ? setShiftClosingCash(e.target.value) : setShiftOpeningCash(e.target.value)}
            sx={{ mb: 2 }}
          />
          {!activeShift && (
            <TextField
              fullWidth
              label="Expected cash"
              type="number"
              value={shiftOpeningCash}
              onChange={(e) => setShiftOpeningCash(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShiftDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={activeShift ? handleCloseShift : handleStartShift} disabled={shiftLoading}>
            {activeShift ? 'Close Shift' : 'Start Shift'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default POS;
