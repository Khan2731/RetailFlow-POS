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
  Chip,
} from '@mui/material';
import { Edit, Delete, Add, Person } from '@mui/icons-material';
import { deliveryAPI, orderAPI, staffAPI } from '../services/api';
import toast from 'react-hot-toast';

const Delivery = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    address: '',
    phone: '',
    driver_name: '',
    delivery_fee: '',
    status: 'pending',
  });
  const [assignData, setAssignData] = useState({ driver_name: '' });

  const statusColors = {
    pending: 'warning',
    in_transit: 'info',
    delivered: 'success',
    cancelled: 'error',
  };

  const formatCurrency = (value, decimals = 2) => {
    const numericValue = Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(decimals) : '0.00';
  };

  useEffect(() => {
    fetchDeliveries();
    fetchOrders();
    fetchDrivers();
  }, []);

  useEffect(() => {
    let filtered = deliveries;
    
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm)
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(d => d.status === statusFilter);
    }
    
    setFilteredDeliveries(filtered);
  }, [searchTerm, statusFilter, deliveries]);

  const fetchDeliveries = async () => {
    try {
      const response = await deliveryAPI.getAll();
      setDeliveries(response.data);
      setFilteredDeliveries(response.data);
    } catch (error) {
      toast.error('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      const availableOrders = response.data.filter(
        order => !deliveries.some(d => d.order_id === order.id)
      );
      setOrders(availableOrders);
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await staffAPI.getByRole('driver');
      setDrivers(response.data);
    } catch (error) {
      toast.error('Failed to fetch drivers');
    }
  };

  const handleOpenDialog = (delivery = null) => {
    if (delivery) {
      setEditingDelivery(delivery);
      setFormData({
        order_id: delivery.order_id,
        customer_name: delivery.customer_name,
        address: delivery.address,
        phone: delivery.phone,
        driver_name: delivery.driver_name || '',
        delivery_fee: delivery.delivery_fee,
        status: delivery.status,
      });
    } else {
      setEditingDelivery(null);
      setFormData({
        order_id: '',
        customer_name: '',
        address: '',
        phone: '',
        driver_name: '',
        delivery_fee: '',
        status: 'pending',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDelivery(null);
    setFormData({
      order_id: '',
      customer_name: '',
      address: '',
      phone: '',
      driver_name: '',
      delivery_fee: '',
      status: 'pending',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        delivery_fee: parseFloat(formData.delivery_fee),
      };
      
      if (editingDelivery) {
        await deliveryAPI.update(editingDelivery.id, data);
        toast.success('Delivery updated successfully');
      } else {
        await deliveryAPI.create(data);
        toast.success('Delivery created successfully');
      }
      handleCloseDialog();
      fetchDeliveries();
      fetchOrders();
    } catch (error) {
      toast.error('Failed to save delivery');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      try {
        await deliveryAPI.delete(id);
        toast.success('Delivery deleted successfully');
        fetchDeliveries();
      } catch (error) {
        toast.error('Failed to delete delivery');
      }
    }
  };

  const handleOpenAssignDialog = (delivery) => {
    setEditingDelivery(delivery);
    setAssignData({ driver_name: delivery.driver_name || '' });
    setAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialog(false);
    setEditingDelivery(null);
    setAssignData({ driver_name: '' });
  };

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    
    try {
      await deliveryAPI.assignDriver(editingDelivery.id, assignData.driver_name);
      toast.success('Driver assigned successfully');
      handleCloseAssignDialog();
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to assign driver');
    }
  };

  const handleUpdateStatus = async (deliveryId, status) => {
    try {
      await deliveryAPI.updateStatus(deliveryId, status);
      toast.success('Status updated successfully');
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to update status');
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
        <Typography variant="h4">Delivery Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Delivery
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search deliveries"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_transit">In Transit</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Delivery ID</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDeliveries.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell>#{delivery.id}</TableCell>
                <TableCell>#{delivery.order_id}</TableCell>
                <TableCell>{delivery.customer_name}</TableCell>
                <TableCell>{delivery.address}</TableCell>
                <TableCell>{delivery.phone}</TableCell>
                <TableCell>{delivery.driver_name || 'Unassigned'}</TableCell>
                <TableCell>${formatCurrency(delivery.delivery_fee)}</TableCell>
                <TableCell>
                  <Chip
                    label={delivery.status.replace('_', ' ')}
                    color={statusColors[delivery.status] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenAssignDialog(delivery)} size="small">
                    <Person />
                  </IconButton>
                  <IconButton onClick={() => handleOpenDialog(delivery)} size="small">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(delivery.id)} size="small">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDelivery ? 'Edit Delivery' : 'New Delivery'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense" required={!editingDelivery}>
              <InputLabel>Select Order</InputLabel>
              <Select
                value={formData.order_id}
                label="Select Order"
                onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                disabled={!!editingDelivery}
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
              label="Customer Name"
              fullWidth
              variant="outlined"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Address"
              fullWidth
              variant="outlined"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              multiline
              rows={2}
            />
            <TextField
              margin="dense"
              label="Phone"
              fullWidth
              variant="outlined"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Assign Driver</InputLabel>
              <Select
                value={formData.driver_name}
                label="Assign Driver"
                onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {drivers.map((driver) => (
                  <MenuItem key={driver.id} value={driver.name}>
                    {driver.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Delivery Fee"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.delivery_fee}
              onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_transit">In Transit</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingDelivery ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={assignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Driver</DialogTitle>
        <form onSubmit={handleAssignDriver}>
          <DialogContent>
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Select Driver</InputLabel>
              <Select
                value={assignData.driver_name}
                label="Select Driver"
                onChange={(e) => setAssignData({ driver_name: e.target.value })}
              >
                {drivers.map((driver) => (
                  <MenuItem key={driver.id} value={driver.name}>
                    {driver.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssignDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Assign
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Delivery;
