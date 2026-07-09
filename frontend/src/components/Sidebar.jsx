import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  RestaurantMenu,
  ReceiptLong,
  History,
  Inventory2,
  People,
  LocalShipping,
  Logout,
  LocalPizza,
  LocalOffer,
  Paid,
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', color: '#1976d2' },
  { text: 'Products', icon: <RestaurantMenu />, path: '/products', color: '#2e7d32' },
  { text: 'Deals', icon: <LocalOffer />, path: '/deals', color: '#e91e63' },
  { text: 'Orders', icon: <ReceiptLong />, path: '/orders', color: '#ed6c02' },
  { text: 'Billing', icon: <ReceiptLong />, path: '/billing', color: '#9c27b0' },
  { text: 'Expenses', icon: <Paid />, path: '/expenses', color: '#43a047' },
  { text: 'Order History', icon: <History />, path: '/order-history', color: '#0288d1' },
  { text: 'Inventory', icon: <Inventory2 />, path: '/inventory', color: '#7b1fa2' },
  { text: 'Staff Management', icon: <People />, path: '/staff', color: '#d32f2f' },
  { text: 'Delivery', icon: <LocalShipping />, path: '/delivery', color: '#0097a7' },
];

const Sidebar = ({ isOpen, onClose, isAdmin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <Drawer
      variant="temporary"
      open={isOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1a237e 0%, #283593 100%)',
          borderRight: 'none',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#ff6b6b', width: 48, height: 48 }}>
          <LocalPizza sx={{ fontSize: 28 }} />
        </Avatar>
        <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
            PizzaHub POS
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {user?.role || 'User'}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />
      
      <Box sx={{ px: 2, mb: 2 }}>
        <Chip
          label={isAdmin ? 'Admin Access' : 'Staff Access'}
          size="small"
          sx={{
            bgcolor: isAdmin ? '#4caf50' : '#ff9800',
            color: 'white',
            fontWeight: 'bold',
            width: '100%',
          }}
        />
      </Box>

      <List sx={{ flexGrow: 1, px: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.15)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? item.color : 'rgba(255,255,255,0.7)' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.7)',
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />

      <List sx={{ px: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'rgba(244, 67, 54, 0.2)',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#f44336' }}>
              <Logout />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                '& .MuiTypography-root': {
                  fontWeight: 500,
                },
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
