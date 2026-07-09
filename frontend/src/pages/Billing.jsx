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
import { Print, Add } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { billingAPI, orderAPI, orderItemAPI } from '../services/api';
import toast from 'react-hot-toast';

const Invoice = ({ billing, order, orderItems, ref }) => (
  <div ref={ref} style={{ padding: '20px', background: 'white' }}>
    <Typography variant="h4" gutterBottom>PizzaHub POS</Typography>
    <Typography variant="h6" gutterBottom>Invoice #{billing.id}</Typography>
    <Box sx={{ my: 2 }}>
      <Typography><strong>Order ID:</strong> {billing.order_id}</Typography>
      <Typography><strong>Table:</strong> {order?.table_no}</Typography>
      <Typography><strong>Waiter:</strong> {order?.waiter_name}</Typography>
      <Typography><strong>Date:</strong> {new Date(billing.created_at).toLocaleString()}</Typography>
    </Box>
    <TableContainer component={Paper} sx={{ mb: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orderItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.product_name}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>Rs. {formatCurrency(item.price)}</TableCell>
              <TableCell>Rs. {formatCurrency(item.line_total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Box sx={{ mt: 2 }}>
      <Typography><strong>Subtotal:</strong> Rs. {formatCurrency(billing.subtotal)}</Typography>
      <Typography><strong>Tax:</strong> Rs. {formatCurrency(billing.tax)}</Typography>
      <Typography><strong>Discount:</strong> Rs. {formatCurrency(billing.discount)}</Typography>
      <Typography variant="h6"><strong>Total:</strong> Rs. {formatCurrency(billing.total)}</Typography>
      <Typography><strong>Payment Method:</strong> {billing.payment_method}</Typography>
    </Box>
  </div>
);

const Billing = () => {
  const formatCurrency = (value, decimals = 2) => {
    const numericValue = Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(decimals) : '0.00';
  };

  const [billingRecords, setBillingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [printDialog, setPrintDialog] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    order_id: '',
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    payment_method: 'cash',
  });
  const printRef = React.useRef();
  const handlePrint = useReactToPrint({ contentRef: printRef });

  useEffect(() => {
    fetchBillingRecords();
    fetchOrders();
  }, []);

  const fetchBillingRecords = async () => {
    try {
      const response = await billingAPI.getAll();
      setBillingRecords(response.data);
    } catch (error) {
      toast.error('Failed to fetch billing records');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      const completedOrders = response.data.filter(o => o.status === 'completed');
      setOrders(completedOrders);
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      order_id: '',
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      payment_method: 'cash',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      order_id: '',
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      payment_method: 'cash',
    });
  };

  const handleOrderSelect = async (orderId) => {
    try {
      const response = await orderItemAPI.getByOrderId(orderId);
      const items = response.data;
      const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
      const tax = subtotal * 0.08;
      const total = subtotal + tax;
      
      setFormData({
        ...formData,
        order_id: orderId,
        subtotal,
        tax,
        total,
      });
    } catch (error) {
      toast.error('Failed to fetch order items');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await billingAPI.create(formData);
      toast.success('Billing record created successfully');
      handleCloseDialog();
      fetchBillingRecords();
    } catch (error) {
      toast.error('Failed to create billing record');
    }
  };

  const handlePrintInvoice = async (billing) => {
    setSelectedBilling(billing);
    try {
      const [orderRes, itemsRes] = await Promise.all([
        orderAPI.getById(billing.order_id),
        orderItemAPI.getByOrderId(billing.order_id),
      ]);
      setSelectedOrder(orderRes.data);
      setOrderItems(itemsRes.data);
      setPrintDialog(true);
    } catch (error) {
      toast.error('Failed to load invoice data');
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
        <Typography variant="h4">Billing</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog}>
          Create Bill
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bill ID</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>Table</TableCell>
              <TableCell>Subtotal</TableCell>
              <TableCell>Tax</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billingRecords.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell>#{bill.id}</TableCell>
                <TableCell>#{bill.order_id}</TableCell>
                <TableCell>{bill.table_no}</TableCell>
                <TableCell>Rs. {formatCurrency(bill.subtotal)}</TableCell>
                <TableCell>Rs. {formatCurrency(bill.tax)}</TableCell>
                <TableCell>Rs. {formatCurrency(bill.discount)}</TableCell>
                <TableCell>Rs. {formatCurrency(bill.total)}</TableCell>
                <TableCell>{bill.payment_method}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handlePrintInvoice(bill)} size="small">
                    <Print />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Bill</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Select Order</InputLabel>
              <Select
                value={formData.order_id}
                label="Select Order"
                onChange={(e) => handleOrderSelect(e.target.value)}
              >
                {orders.map((order) => (
                  <MenuItem key={order.id} value={order.id}>
                    Order #{order.id} - Table {order.table_no}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Subtotal"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.subtotal}
              onChange={(e) => {
                const subtotal = parseFloat(e.target.value) || 0;
                const tax = subtotal * 0.08;
                const total = subtotal + tax - (formData.discount || 0);
                setFormData({ ...formData, subtotal, tax, total });
              }}
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
            <TextField
              margin="dense"
              label="Tax"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.tax}
              onChange={(e) => {
                const tax = parseFloat(e.target.value) || 0;
                const total = formData.subtotal + tax - (formData.discount || 0);
                setFormData({ ...formData, tax, total });
              }}
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
            <TextField
              margin="dense"
              label="Discount"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.discount}
              onChange={(e) => {
                const discount = parseFloat(e.target.value) || 0;
                const total = formData.subtotal + formData.tax - discount;
                setFormData({ ...formData, discount, total });
              }}
              inputProps={{ step: '0.01', min: '0' }}
            />
            <TextField
              margin="dense"
              label="Total"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={formData.payment_method}
                label="Payment Method"
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="online">Online</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create Bill
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={printDialog} onClose={() => setPrintDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Print Invoice</DialogTitle>
        <DialogContent>
          <Invoice
            ref={printRef}
            billing={selectedBilling}
            order={selectedOrder}
            orderItems={orderItems}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialog(false)}>Close</Button>
          <Button variant="contained" onClick={handlePrint}>
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Billing;
