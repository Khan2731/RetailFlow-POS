import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Print } from '@mui/icons-material';
import ReactToPrint from 'react-to-print';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const printRef = useRef();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      setOrders(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      setOrders([]);
      setError('Unable to fetch orders. Please refresh or check your connection.');
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    if (!lowerSearch) return true;
    const orderIdText = String(order.id || '').toLowerCase();
    const waiterText = String(order.waiter_name || '').toLowerCase();
    return orderIdText.includes(lowerSearch) || waiterText.includes(lowerSearch);
  });

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Order Details</Typography>
        <TextField
          size="small"
          label="Search by Order ID or Waiter"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 260, mr: 1 }}
        />
        <ReactToPrint
          trigger={() => (
            <Button variant="outlined" startIcon={<Print />}>
              Print Orders
            </Button>
          )}
          content={() => printRef.current}
        />
      </Box>

      <Box ref={printRef}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Order Summary
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Table No</TableCell>
                  <TableCell>Waiter</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Order Time</TableCell>
                  <TableCell align="right">Total Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      {error || 'No matching orders found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const date = order.order_time ? new Date(order.order_time) : null;
                    const orderDate = date ? date.toLocaleDateString() : '-';
                    const orderTime = date ? date.toLocaleTimeString() : '-';
                    const total = Number(order.estimated_total ?? 0).toFixed(2);

                    return (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.table_no}</TableCell>
                        <TableCell>{order.waiter_name}</TableCell>
                        <TableCell>{orderDate}</TableCell>
                        <TableCell>{orderTime}</TableCell>
                        <TableCell align="right">Rs. {total}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default Orders;
