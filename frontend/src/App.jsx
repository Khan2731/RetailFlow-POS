import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Billing from './pages/Billing';
import OrderHistory from './pages/OrderHistory';
import Inventory from './pages/Inventory';
import Staff from './pages/Staff';
import Delivery from './pages/Delivery';
import POS from './pages/POS';
import Deals from './pages/Deals';
import Expenses from './pages/Expenses';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const Layout = ({ children, title, showSidebar = true, fullWidth = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  if (!showSidebar) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} fullWidth={fullWidth} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin()}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: fullWidth ? 0 : 3,
          width: '100%',
          ml: 0,
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout title="Dashboard" fullWidth>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Layout title="Products">
                <Products />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Layout title="Orders">
                <Orders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <Layout title="Billing">
                <Billing />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <ProtectedRoute>
              <Layout title="Order History">
                <OrderHistory />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Layout title="Inventory">
                <Inventory />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <Layout title="Staff Management">
                <Staff />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery"
          element={
            <ProtectedRoute>
              <Layout title="Delivery Management">
                <Delivery />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/deals"
          element={
            <ProtectedRoute>
              <Layout title="Deals Management">
                <Deals />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Layout title="Expenses">
                <Expenses />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <Layout showSidebar={false}>
                <POS />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
