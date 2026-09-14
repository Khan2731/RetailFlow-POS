import React, { useState } from 'react';
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
  Collapse,
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
  ExpandLess,
  ExpandMore,
  EventNote,
  HistoryEdu,
  Assessment,
  MonetizationOn,
  Payments,
  PendingActions,
  AccountBalanceWallet,
  PersonAdd,
  Storefront,
  Cancel,
} from '@mui/icons-material';

const drawerWidth = 280;

const topMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', color: '#1976d2' },
  { text: 'Products', icon: <RestaurantMenu />, path: '/products', color: '#2e7d32' },
  { text: 'Deals', icon: <LocalOffer />, path: '/deals', color: '#e91e63' },
  { text: 'Billing', icon: <ReceiptLong />, path: '/billing', color: '#9c27b0' },
  { text: 'Expenses', icon: <Paid />, path: '/expenses', color: '#43a047' },
  { text: 'Order History', icon: <History />, path: '/order-history', color: '#0288d1' },
  { text: 'Cancelled Orders', icon: <Cancel />, path: '/cancelled-orders', color: '#d32f2f' },
  { text: 'Add Employee', icon: <PersonAdd />, path: '/staff?action=add', color: '#d32f2f' },
];

const employeeSubItems = [
  { text: 'Employee List', icon: <People />, path: '/staff', color: '#d32f2f' },
  { text: 'Add Employee', icon: <PersonAdd />, path: '/staff?action=add', color: '#d32f2f' },
];

const attendanceSubItems = [
  { text: 'Daily Attendance', icon: <EventNote />, path: '/attendance/daily', color: '#1565c0' },
  { text: 'Attendance History', icon: <HistoryEdu />, path: '/attendance/history', color: '#1565c0' },
  { text: 'Monthly Report', icon: <Assessment />, path: '/attendance/report', color: '#1565c0' },
];

const advanceSubItems = [
  { text: 'New Advance', icon: <MonetizationOn />, path: '/salary-advances', color: '#e65100' },
  { text: 'Advance History', icon: <AccountBalanceWallet />, path: '/salary-advances', color: '#e65100' },
  { text: 'Pending Recoveries', icon: <PendingActions />, path: '/salary-advances/pending', color: '#e65100' },
];

const payrollSubItems = [
  { text: 'Monthly Salary', icon: <Payments />, path: '/payroll/monthly', color: '#2e7d32' },
  { text: 'Salary History', icon: <History />, path: '/payroll/history', color: '#2e7d32' },
];

const SubMenu = ({ label, icon, color, subItems, location, navigate, onClose }) => {
  const isActive = subItems.some((i) => location.pathname === i.path.split('?')[0]);
  const [open, setOpen] = useState(isActive);

  return (
    <>
      <ListItem disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          onClick={() => setOpen((o) => !o)}
          sx={{
            borderRadius: 2,
            bgcolor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <ListItemIcon sx={{ color: isActive ? color : 'rgba(255,255,255,0.7)', minWidth: 40 }}>{icon}</ListItemIcon>
          <ListItemText
            primary={label}
            sx={{
              color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
              '& .MuiTypography-root': { fontWeight: isActive ? 600 : 400, fontSize: '0.92rem' },
            }}
          />
          {open ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.5)' }} /> : <ExpandMore sx={{ color: 'rgba(255,255,255,0.5)' }} />}
        </ListItemButton>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 2 }}>
          {subItems.map((item) => {
            const itemPath = item.path.split('?')[0];
            const selected = location.pathname === itemPath;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={selected}
                  onClick={() => { navigate(item.path); onClose(); }}
                  sx={{
                    borderRadius: 2,
                    pl: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  <ListItemIcon sx={{ color: selected ? item.color : 'rgba(255,255,255,0.55)', minWidth: 36, '& svg': { fontSize: 18 } }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      color: selected ? 'white' : 'rgba(255,255,255,0.65)',
                      '& .MuiTypography-root': { fontWeight: selected ? 600 : 400, fontSize: '0.85rem' },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </>
  );
};

const Sidebar = ({ isOpen, onClose, isAdmin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '#/login';
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

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1 }} />

      <Box sx={{ px: 2, mb: 1 }}>
        <Chip
          label={isAdmin ? 'Admin Access' : 'Staff Access'}
          size="small"
          sx={{ bgcolor: isAdmin ? '#4caf50' : '#ff9800', color: 'white', fontWeight: 'bold', width: '100%' }}
        />
      </Box>

      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        <List sx={{ px: 2 }}>
          {(isAdmin ? topMenuItems : []).map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => { navigate(item.path); onClose(); }}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? item.color : 'rgba(255,255,255,0.7)' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.7)',
                    '& .MuiTypography-root': { fontWeight: location.pathname === item.path ? 600 : 400 },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {isAdmin && (
            <>
              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1.5 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', px: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Employees
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <SubMenu
                  label="Employee List"
                  icon={<People />}
                  color="#d32f2f"
                  subItems={employeeSubItems}
                  location={location}
                  navigate={navigate}
                  onClose={onClose}
                />
                <SubMenu
                  label="Attendance"
                  icon={<EventNote />}
                  color="#1565c0"
                  subItems={attendanceSubItems}
                  location={location}
                  navigate={navigate}
                  onClose={onClose}
                />
                <SubMenu
                  label="Salary Advances"
                  icon={<MonetizationOn />}
                  color="#e65100"
                  subItems={advanceSubItems}
                  location={location}
                  navigate={navigate}
                  onClose={onClose}
                />
                <SubMenu
                  label="Payroll"
                  icon={<Payments />}
                  color="#2e7d32"
                  subItems={payrollSubItems}
                  location={location}
                  navigate={navigate}
                  onClose={onClose}
                />
              </Box>
            </>
          )}
        </List>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1 }} />

      <List sx={{ px: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' } }}
          >
            <ListItemIcon sx={{ color: '#f44336' }}><Logout /></ListItemIcon>
            <ListItemText
              primary="Logout"
              sx={{ color: 'rgba(255,255,255,0.7)', '& .MuiTypography-root': { fontWeight: 500 } }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
