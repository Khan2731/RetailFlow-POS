import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { orderAPI, orderItemAPI } from '../services/api';
import toast from 'react-hot-toast';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const statusColors = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'error',
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(order =>
      order.waiter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      order.table_no.toString().includes(searchTerm)
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const handleOpenOrder = async (order) => {
    try {
      const response = await orderItemAPI.getByOrderId(order.id);
      setSelectedOrder(order);
      setOrderItems(response.data || []);
      setDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load order details');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      console.log('Orders response:', response.data);
      setOrders(response.data || []);
      setFilteredOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch order history');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
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
      <Typography variant="h4" gutterBottom>
        Order History
      </Typography>

      <TextField
        label="Search orders"
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3, width: '100%' }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Table No</TableCell>
              <TableCell>Waiter</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Business Date</TableCell>
              <TableCell>Cancellation Reason</TableCell>
              <TableCell>Order Time</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No orders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{order.table_no}</TableCell>
                  <TableCell>{order.waiter_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={statusColors[order.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{order.business_date || '—'}</TableCell>
                  <TableCell>{order.cancellation_reason || '—'}</TableCell>
                  <TableCell>{new Date(order.order_time || order.created_at).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<Visibility />} onClick={() => handleOpenOrder(order)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Order #{selectedOrder.id}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Type: {selectedOrder.order_type === 'take_away' ? 'Take Away' : selectedOrder.order_type === 'delivery' ? 'Delivery' : 'Dine In'} • Status: {selectedOrder.status}
              </Typography>
              {selectedOrder.status === 'cancelled' && (
                <Box sx={{ mb: 2, p: 2, bgcolor: '#fff5f5', borderRadius: 2 }}>
                  <Typography variant="body2"><strong>Cancelled by:</strong> {selectedOrder.cancelled_by_name || '—'}</Typography>
                  <Typography variant="body2"><strong>Cancellation reason:</strong> {selectedOrder.cancellation_reason || '—'}</Typography>
                  <Typography variant="body2"><strong>Cancelled at:</strong> {selectedOrder.cancelled_at ? new Date(selectedOrder.cancelled_at).toLocaleString() : '—'}</Typography>
                  <Typography variant="body2"><strong>Business date:</strong> {selectedOrder.business_date || '—'}</Typography>
                </Box>
              )}
              <TableContainer component={Paper} variant="outlined">
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
                    {orderItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No items found</TableCell>
                      </TableRow>
                    ) : (
                      orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product_name || item.item_name || `Item ${item.product_id}`}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>Rs. {Number(item.price || 0).toFixed(2)}</TableCell>
                          <TableCell>Rs. {Number(item.line_total || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderHistory;
