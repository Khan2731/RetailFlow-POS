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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Print, Download } from '@mui/icons-material';
import ReactToPrint from 'react-to-print';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
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

  const exportToExcel = () => {
    const rows = filteredOrders.map((order) => ({
      id: order.id,
      table_no: order.table_no || '',
      waiter_name: order.waiter_name || '',
      order_type: order.order_type === 'take_away' ? 'Take Away' : order.order_type === 'delivery' ? 'Delivery' : 'Dine In',
      status: order.status || 'pending',
      order_time: order.order_time ? new Date(order.order_time).toLocaleString() : '',
      total_price: Number(order.estimated_total || 0).toFixed(2),
    }));

    const csvContent = [
      ['Order ID', 'Table No', 'Waiter', 'Type', 'Status', 'Order Time', 'Total Price'],
      ...rows.map((row) => [row.id, row.table_no, row.waiter_name, row.order_type, row.status, row.order_time, row.total_price]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orders.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter((order) => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    const orderTime = new Date(order.order_time || order.created_at || Date.now());
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const matchesSearch = !lowerSearch || [String(order.id || ''), String(order.waiter_name || ''), String(order.table_no || ''), String(order.order_type || '')].join(' ').toLowerCase().includes(lowerSearch);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.order_type === typeFilter;
    const yesterdayStart = new Date(now); yesterdayStart.setDate(now.getDate() - 1); yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(now); yesterdayEnd.setDate(now.getDate() - 1); yesterdayEnd.setHours(23, 59, 59, 999);
    const matchesRange = (() => {
      if (rangeFilter === 'today') return orderTime >= todayStart;
      if (rangeFilter === 'yesterday') return orderTime >= yesterdayStart && orderTime <= yesterdayEnd;
      if (rangeFilter === 'week') return orderTime >= weekStart;
      if (rangeFilter === 'month') return orderTime >= monthStart;
      return true;
    })();

    return matchesSearch && matchesStatus && matchesType && matchesRange;
  });

  const salesTotal = filteredOrders.reduce((sum, order) => sum + Number(order.estimated_total || 0), 0);

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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={exportToExcel}>
            Export Excel
          </Button>
          <ReactToPrint
            trigger={() => (
              <Button variant="outlined" startIcon={<Print />}>
                Print Orders
              </Button>
            )}
            content={() => printRef.current}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" label="Search by ID, waiter, table, or type" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ minWidth: 280, flexGrow: 1 }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="canceled">Canceled</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Order Type</InputLabel>
          <Select value={typeFilter} label="Order Type" onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="dine_in">Dine In</MenuItem>
            <MenuItem value="take_away">Take Away</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Range</InputLabel>
          <Select value={rangeFilter} label="Range" onChange={(e) => setRangeFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="yesterday">Yesterday</MenuItem>
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Filter Summary</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${filteredOrders.length} orders`} color="primary" variant="outlined" />
            <Chip label={`Rs. ${salesTotal.toFixed(2)}`} color="success" variant="outlined" />
          </Box>
        </Box>
      </Paper>

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
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell align="right">Total Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
                        <TableCell>{order.table_no || '-'}</TableCell>
                        <TableCell>{order.waiter_name}</TableCell>
                        <TableCell>{order.order_type === 'take_away' ? 'Take Away' : 'Dine In'}</TableCell>
                        <TableCell>{order.status || 'pending'}</TableCell>
                        <TableCell>{`${orderDate} ${orderTime}`}</TableCell>
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
