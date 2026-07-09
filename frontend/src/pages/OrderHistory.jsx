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
} from '@mui/material';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
              <TableCell>Order Time</TableCell>
              <TableCell>Updated</TableCell>
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
                  <TableCell>{new Date(order.order_time).toLocaleString()}</TableCell>
                  <TableCell>{new Date(order.updated_at).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default OrderHistory;
