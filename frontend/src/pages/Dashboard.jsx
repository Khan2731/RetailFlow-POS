import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Restaurant,
  Receipt,
  AttachMoney,
  LocalShipping,
} from '@mui/icons-material';
import { orderAPI, productAPI, billingAPI, deliveryAPI } from '../services/api';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color, fontSize: 44 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [ordersRes, productsRes, billingRes, deliveryRes] = await Promise.all([
        orderAPI.getAll(),
        productAPI.getAll(),
        billingAPI.getAll(),
        deliveryAPI.getAll(),
      ]);

      const totalRevenue = billingRes.data.reduce((sum, bill) => sum + Number(bill.total || 0), 0);
      const pendingDeliveries = deliveryRes.data.filter(
        (d) => d.status === 'pending' || d.status === 'in_transit'
      ).length;

      setStats({
        totalOrders: ordersRes.data.length,
        totalProducts: productsRes.data.length,
        totalRevenue: totalRevenue.toFixed(2),
        pendingDeliveries,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h6" sx={{ mt: 6, textAlign: 'center' }}>
          Loading dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography color="text.secondary">
            Overview of orders, products, revenue, and active deliveries.
          </Typography>
        </Box>
        <Box sx={{ bgcolor: '#e3f2fd', px: 3, py: 2, borderRadius: 3 }}>
          <Typography variant="subtitle2" color="primary">
            Ready to manage your restaurant with confidence.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Orders" value={stats.totalOrders} icon={<Receipt />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Products" value={stats.totalProducts} icon={<Restaurant />} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Revenue" value={`Rs. ${stats.totalRevenue}`} icon={<AttachMoney />} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Deliveries" value={stats.pendingDeliveries} icon={<LocalShipping />} color="#d32f2f" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Quick Actions
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Use the sidebar to open product management, deals, billing, and delivery tools.
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Typography variant="body2">• Manage product catalog and pricing.</Typography>
              <Typography variant="body2">• Add or update promotional deals.</Typography>
              <Typography variant="body2">• Track pending deliveries and recent billing.</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Notes
            </Typography>
            <Typography color="text.secondary">
              Data is refreshed when the page loads. Refresh the page if you make backend changes outside this panel.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              This dashboard is optimized for admin use. Cashiers should use the POS page for order entry.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
