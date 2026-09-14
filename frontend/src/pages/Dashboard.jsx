import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  TextField,
  Skeleton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import {
  Restaurant,
  Receipt,
  AttachMoney,
  LocalShipping,
  TrendingUp,
  TrendingDown,
  Inventory2,
  ShowChart,
  CalendarToday,
  Groups,
  EventBusy,
  WorkOff,
  AccountBalanceWallet,
  Storefront,
  Cancel,
  CheckCircle,
  PendingActions,
  ArrowDropUp,
  ArrowDropDown,
} from '@mui/icons-material';
import { orderAPI, productAPI, billingAPI, deliveryAPI, orderItemAPI, attendanceAPI, salaryAdvanceAPI, payrollAPI, vendorAPI, inventoryMovementAPI } from '../services/api';

// ---- Design tokens (kept consistent across the whole dashboard) ----
const COLORS = {
  ink: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  surface: '#ffffff',
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  violet: '#7c3aed',
};

const cardShadow = '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 20px rgba(15, 23, 42, 0.05)';

const StatCard = ({ title, value, icon, color, hint }) => (
  <Card variant="outlined" sx={{ borderRadius: 3, borderColor: COLORS.border, boxShadow: cardShadow, height: '100%' }}>
    <CardContent sx={{ py: 2.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ color: COLORS.muted, fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.ink, lineHeight: 1.2 }} noWrap>
            {value}
          </Typography>
          {hint && (
            <Typography variant="caption" sx={{ color: COLORS.muted }}>
              {hint}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}14`,
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const SectionLabel = ({ children }) => (
  <Typography
    variant="overline"
    sx={{ color: COLORS.muted, fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5 }}
  >
    {children}
  </Typography>
);

const SalesBar = ({ label, value, maxValue, color, active }) => (
  <Box sx={{ mb: 1.75 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: active ? 700 : 400, color: active ? COLORS.ink : COLORS.muted }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
        Rs. {value.toFixed(2)}
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={Math.max(4, (value / maxValue) * 100)}
      sx={{ height: 7, borderRadius: 999, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 999 } }}
    />
  </Box>
);

const ProductBar = ({ label, value, maxValue, color }) => (
  <Box sx={{ mb: 1.25 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2" sx={{ color: COLORS.ink }} noWrap title={label}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.muted, flexShrink: 0, ml: 1 }}>
        {value} sold
      </Typography>
    </Box>
    <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 999, height: 7, overflow: 'hidden' }}>
      <Box sx={{ width: `${Math.max(4, (value / maxValue) * 100)}%`, bgcolor: color, height: '100%', borderRadius: 999 }} />
    </Box>
  </Box>
);

const SalesTrendChart = ({ data }) => {
  if (!data.length) {
    return (
      <Typography variant="body2" sx={{ color: COLORS.muted, py: 4, textAlign: 'center' }}>
        No sales trend data yet.
      </Typography>
    );
  }

  const width = 560;
  const height = 170;
  const padding = 28;
  const maxValue = Math.max(...data.map((entry) => entry.value), 1);
  const points = data.map((entry, index) => {
    const x = padding + (index / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = height - padding - (entry.value / maxValue) * (height - padding * 2);
    return { x, y };
  });
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;

  return (
    <Box>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="170" role="img" aria-label="Sales trend chart">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={COLORS.border} strokeWidth="1" />
        <polygon points={areaPoints} fill={COLORS.primary} opacity="0.08" />
        <polyline fill="none" stroke={COLORS.primary} strokeWidth="2.5" points={polylinePoints} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, index) => (
          <circle key={index} cx={p.x} cy={p.y} r="3.5" fill={COLORS.surface} stroke={COLORS.primary} strokeWidth="2" />
        ))}
      </svg>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
        {data.map((entry, i) => (
          <Typography key={`${entry.label}-${i}`} variant="caption" sx={{ color: COLORS.muted }}>
            {entry.label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 'Rs. 0.00';
  return `Rs. ${amount.toFixed(2)}`;
};

const getStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return { label: 'Completed', color: 'success' };
  if (normalized === 'pending') return { label: 'Pending', color: 'warning' };
  if (normalized === 'cancelled') return { label: 'Cancelled', color: 'error' };
  if (normalized === 'in_transit' || normalized === 'on the way') return { label: 'In Transit', color: 'info' };
  return { label: String(status || 'Unknown'), color: 'default' };
};

const DashboardSkeleton = () => (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <Skeleton variant="text" width={240} height={44} sx={{ mb: 3 }} />
    <Grid container spacing={2}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rounded" height={104} sx={{ borderRadius: 3 }} />
        </Grid>
      ))}
    </Grid>
  </Container>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingDeliveries: 0,
  });
  const [hrStats, setHrStats] = useState({ present: 0, absent: 0, on_leave: 0, total_staff: 0 });
  const [advanceStats, setAdvanceStats] = useState({ pending_count: 0, total_outstanding: 0 });
  const [payrollStats, setPayrollStats] = useState({ pending_count: 0, pending_amount: 0 });
  const [vendorStats, setVendorStats] = useState({ total_vendors: 0, outstanding: 0 });
  const [invStats, setInvStats] = useState({ low_stock: 0, out_of_stock: 0 });
  const [salesSummary, setSalesSummary] = useState({ daily: 0, weekly: 0, monthly: 0, yesterday: 0, customTotal: 0 });
  const [allOrders, setAllOrders] = useState([]);
  const [cancellationStats, setCancellationStats] = useState({ totalCancelled: 0, periodCancelled: 0, reasons: [] });
  const [topProducts, setTopProducts] = useState([]);
  const [lowProducts, setLowProducts] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [range, setRange] = useState('monthly');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [allBillingData, setAllBillingData] = useState([]);
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

      // HR / vendor / inventory stats are supplementary — don't block the core dashboard on them.
      try {
        const [hrRes, advRes, prRes, vRes, invRes] = await Promise.all([
          attendanceAPI.getTodayStats(),
          salaryAdvanceAPI.getStats(),
          payrollAPI.getStats(),
          vendorAPI.getStats(),
          inventoryMovementAPI.getStats(),
        ]);
        setHrStats(hrRes.data || {});
        setAdvanceStats(advRes.data || {});
        setPayrollStats(prRes.data || {});
        setVendorStats(vRes.data || {});
        setInvStats(invRes.data || {});
      } catch {
        /* optional widgets — safe to ignore */
      }

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const bills = Array.isArray(billingRes.data) ? billingRes.data : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const deliveries = Array.isArray(deliveryRes.data) ? deliveryRes.data : [];

      const totalRevenue = bills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);
      const pendingDeliveries = deliveries.filter((d) => d.status === 'pending' || d.status === 'in_transit').length;

      const now = new Date();
      const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
      const yesterdayStart = new Date(now); yesterdayStart.setDate(now.getDate() - 1); yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(now); yesterdayEnd.setDate(now.getDate() - 1); yesterdayEnd.setHours(23, 59, 59, 999);
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const completedOrders = orders.filter((order) => String(order.status || '').toLowerCase() === 'completed');
      const parseOrderTime = (order) => new Date(order.order_time || order.created_at || order.createdAt || null);
      const safeOrderTotal = (order) => Number(order.estimated_total || 0);

      const dailyRevenue = completedOrders.filter((order) => parseOrderTime(order) >= dayStart).reduce((sum, order) => sum + safeOrderTotal(order), 0);
      const yesterdayRevenue = completedOrders.filter((order) => {
        const createdAt = parseOrderTime(order);
        return createdAt >= yesterdayStart && createdAt <= yesterdayEnd;
      }).reduce((sum, order) => sum + safeOrderTotal(order), 0);
      const weeklyRevenue = completedOrders.filter((order) => parseOrderTime(order) >= weekStart).reduce((sum, order) => sum + safeOrderTotal(order), 0);
      const monthlyRevenue = completedOrders.filter((order) => parseOrderTime(order) >= monthStart).reduce((sum, order) => sum + safeOrderTotal(order), 0);

      const historyMap = completedOrders.reduce((acc, order) => {
        const createdAt = parseOrderTime(order);
        if (!createdAt || Number.isNaN(createdAt.getTime())) return acc;
        const dateKey = createdAt.toISOString().slice(0, 10);
        acc[dateKey] = (acc[dateKey] || 0) + safeOrderTotal(order);
        return acc;
      }, {});
      const history = Object.entries(historyMap)
        .map(([dateKey, value]) => ({ date: new Date(dateKey).getTime(), label: new Date(dateKey).toLocaleDateString(), value }))
        .sort((a, b) => a.date - b.date)
        .slice(-8);

      setAllBillingData(bills);

      const salesMap = {};
      const fallbackItems = Array.isArray(ordersRes.data) ? [] : [];

      orders.forEach((order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        if (!items.length) return;
        items.forEach((item) => {
          const name = item.product_name || item.name || `Product ${item.product_id || 'unknown'}`;
          salesMap[name] = (salesMap[name] || 0) + Number(item.quantity || 0);
        });
      });

      const sortedProducts = Object.entries(salesMap)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity);

      setAllOrders(orders);
      setStats({
        totalOrders: orders.length,
        totalProducts: products.length,
        totalRevenue: totalRevenue.toFixed(2),
        pendingDeliveries,
      });
      setSalesSummary({ daily: dailyRevenue, weekly: weeklyRevenue, monthly: monthlyRevenue, yesterday: yesterdayRevenue, customTotal: 0 });
      setTopProducts(sortedProducts.slice(0, 5));
      setLowProducts(sortedProducts.slice(-5).reverse());
      setHistoryData(history);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allOrders.length) return;

    const normalizeDate = (value) => (value ? new Date(value) : null);
    const start = normalizeDate(startDateTime);
    const end = normalizeDate(endDateTime);

    const cancelledOrders = allOrders.filter((order) => String(order.status || '').toLowerCase() === 'cancelled');
    const filteredCancelledOrders = cancelledOrders.filter((order) => {
      const cancelledAt = new Date(order.cancelled_at || order.updated_at || order.order_time || order.created_at);
      if (start && cancelledAt < start) return false;
      if (end) {
        const endOfRange = new Date(end);
        endOfRange.setHours(23, 59, 59, 999);
        if (cancelledAt > endOfRange) return false;
      }
      return true;
    });

    const reasonsMap = filteredCancelledOrders.reduce((acc, order) => {
      const reason = String(order.cancellation_reason || 'Other').trim() || 'Other';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    setCancellationStats({
      totalCancelled: cancelledOrders.length,
      periodCancelled: filteredCancelledOrders.length,
      reasons: Object.entries(reasonsMap)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
    });
  }, [allOrders, startDateTime, endDateTime]);

  useEffect(() => {
    if (!allBillingData.length) return;

    const normalizeDate = (value) => (value ? new Date(value) : null);
    const start = normalizeDate(startDateTime);
    const end = normalizeDate(endDateTime);

    const filteredBills = allBillingData.filter((bill) => {
      const createdAt = new Date(bill.created_at);
      if (start && createdAt < start) return false;
      if (end) {
        const endOfRange = new Date(end);
        endOfRange.setHours(23, 59, 59, 999);
        if (createdAt > endOfRange) return false;
      }
      return true;
    });

    const totalRevenue = filteredBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);
    const dayStart = start ? new Date(start) : new Date();
    if (!start) dayStart.setHours(0, 0, 0, 0);
    const dayEnd = end ? new Date(end) : new Date();
    if (!end) dayEnd.setHours(23, 59, 59, 999);

    const filteredHistory = filteredBills
      .map((bill) => ({
        date: new Date(bill.created_at).getTime(),
        label: new Date(bill.created_at).toLocaleDateString(),
        value: Number(bill.total || 0),
      }))
      .sort((a, b) => a.date - b.date)
      .slice(-8);

    setSalesSummary({
      daily: filteredBills.filter((bill) => {
        const createdAt = new Date(bill.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).reduce((sum, bill) => sum + Number(bill.total || 0), 0),
      weekly: filteredBills.filter((bill) => {
        const createdAt = new Date(bill.created_at);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        return createdAt >= weekStart;
      }).reduce((sum, bill) => sum + Number(bill.total || 0), 0),
      monthly: filteredBills.filter((bill) => {
        const createdAt = new Date(bill.created_at);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return createdAt >= monthStart;
      }).reduce((sum, bill) => sum + Number(bill.total || 0), 0),
      yesterday: filteredBills.filter((bill) => {
        const createdAt = new Date(bill.created_at);
        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date();
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return createdAt >= yesterdayStart && createdAt <= yesterdayEnd;
      }).reduce((sum, bill) => sum + Number(bill.total || 0), 0),
      customTotal: totalRevenue,
    });
    setHistoryData(filteredHistory);
  }, [allBillingData, startDateTime, endDateTime]);

  const salesMax = useMemo(
    () => Math.max(salesSummary.weekly || 1, salesSummary.daily || 1, salesSummary.monthly || 1, salesSummary.yesterday || 1, 1),
    [salesSummary]
  );
  const productMax = useMemo(
    () => Math.max(...topProducts.map((p) => p.quantity), ...lowProducts.map((p) => p.quantity), 1),
    [topProducts, lowProducts]
  );

  const activeRangeSummary =
    range === 'today' ? salesSummary.daily
      : range === 'yesterday' ? salesSummary.yesterday
      : range === 'week' ? salesSummary.weekly
      : range === 'custom' ? (salesSummary.customTotal || 0)
      : salesSummary.monthly;

  const quickActions = [
    { label: 'Products', icon: <Restaurant />, path: '/products', subtitle: 'Manage menu items' },
    { label: 'Orders', icon: <Receipt />, path: '/order-history', subtitle: 'Review recent sales' },
    { label: 'Inventory', icon: <Inventory2 />, path: '/inventory', subtitle: 'Track stock levels' },
    { label: 'Staff', icon: <Groups />, path: '/staff', subtitle: 'Manage employees' },
  ];

  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.order_time) - new Date(a.order_time))
    .slice(0, 5);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 5 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'grid', gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: COLORS.border, boxShadow: cardShadow }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.ink, letterSpacing: -0.5 }}>
                Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.muted, mt: 1, maxWidth: 560 }}>
                A clean, modern view of your PizzaHub operations — sales, orders, products, stock and employee activity.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: COLORS.primary, width: 42, height: 42, fontWeight: 700 }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </Avatar>
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.ink }}>
                    {user?.name || 'Admin'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                    {user?.role ? user.role.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Administrator'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <CalendarToday sx={{ fontSize: 18, color: COLORS.muted }} />
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  {new Date().toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Operations */}
      <Box sx={{ mb: 3.5 }}>
        <SectionLabel>Operations</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Orders" value={stats.totalOrders} icon={<Receipt />} color={COLORS.primary} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Products" value={stats.totalProducts} icon={<Restaurant />} color={COLORS.success} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Today's Sales" value={`Rs. ${salesSummary.daily.toFixed(2)}`} icon={<TrendingUp />} color={COLORS.primary} hint="Completed orders only" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Revenue" value={`Rs. ${stats.totalRevenue}`} icon={<AttachMoney />} color={COLORS.warning} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Pending Deliveries" value={stats.pendingDeliveries} icon={<LocalShipping />} color={COLORS.danger} />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 3.5 }}>
        <SectionLabel>Quick Actions</SectionLabel>
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid item xs={12} sm={6} md={3} key={action.label}>
              <Paper
                onClick={() => navigate(action.path)}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  borderColor: COLORS.border,
                  boxShadow: cardShadow,
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.primary }}>
                    {action.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.ink }}>
                    {action.label}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  {action.subtitle}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Workforce */}
      <Box sx={{ mb: 3.5 }}>
        <SectionLabel>Workforce — Today</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <StatCard title="Present" value={hrStats.present ?? 0} icon={<Groups />} color={COLORS.success} hint={hrStats.total_staff ? `of ${hrStats.total_staff} staff` : undefined} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard title="Absent" value={hrStats.absent ?? 0} icon={<EventBusy />} color={COLORS.danger} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard title="On Leave" value={hrStats.on_leave ?? 0} icon={<WorkOff />} color={COLORS.primary} />
          </Grid>
        </Grid>
      </Box>

      {/* Finance */}
      <Box sx={{ mb: 3.5 }}>
        <SectionLabel>Finance</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Pending Advances" value={`Rs. ${Number(advanceStats.total_outstanding ?? 0).toFixed(0)}`} icon={<AccountBalanceWallet />} color={COLORS.warning} hint={advanceStats.pending_count ? `${advanceStats.pending_count} requests` : undefined} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Payroll Due" value={`Rs. ${Number(payrollStats.pending_amount ?? 0).toFixed(0)}`} icon={<AttachMoney />} color={COLORS.violet} hint={payrollStats.pending_count ? `${payrollStats.pending_count} employees` : undefined} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Active Vendors" value={vendorStats.total_vendors ?? 0} icon={<Storefront />} color={COLORS.primary} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Vendor Outstanding" value={`Rs. ${Number(vendorStats.outstanding ?? 0).toFixed(0)}`} icon={<ShowChart />} color={COLORS.danger} />
          </Grid>
        </Grid>
      </Box>

      {/* Cancellations */}
      <Box sx={{ mb: 3.5 }}>
        <SectionLabel>Order Cancellations</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Cancelled Orders" value={cancellationStats.totalCancelled} icon={<Cancel />} color={COLORS.danger} hint="All time" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Selected Period" value={cancellationStats.periodCancelled} icon={<CalendarToday />} color={COLORS.warning} hint="Matches current dashboard range" />
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: COLORS.border, boxShadow: cardShadow, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ink, mb: 1 }}>
                Cancellation Reasons
              </Typography>
              {cancellationStats.reasons.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.muted }}>No cancellations recorded for the selected period.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {cancellationStats.reasons.map((item) => (
                    <Box key={item.reason} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: COLORS.ink }}>{item.reason}</Typography>
                      <Chip label={item.count} size="small" color="error" variant="outlined" />
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Inventory */}
      <Box sx={{ mb: 4 }}>
        <SectionLabel>Inventory</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <StatCard title="Low Stock Items" value={invStats.low_stock ?? 0} icon={<TrendingDown />} color={COLORS.warning} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StatCard title="Out of Stock" value={invStats.out_of_stock ?? 0} icon={<Inventory2 />} color={COLORS.danger} />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <SectionLabel>Recent Orders</SectionLabel>
        <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: COLORS.border, boxShadow: cardShadow, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ color: COLORS.muted, fontWeight: 700 }}>Order ID</TableCell>
                  <TableCell sx={{ color: COLORS.muted, fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ color: COLORS.muted, fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ color: COLORS.muted, fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ color: COLORS.muted, fontWeight: 700 }}>Order Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 4, textAlign: 'center', color: COLORS.muted }}>
                      No recent orders available.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => {
                    const status = getStatusLabel(order.status);
                    return (
                      <TableRow key={order.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>#{order.id}</TableCell>
                        <TableCell>{order.order_type === 'take_away' ? 'Take Away' : order.order_type === 'delivery' ? 'Delivery' : 'Dine In'}</TableCell>
                        <TableCell>
                          <Chip label={status.label} color={status.color} size="small" sx={{ textTransform: 'capitalize' }} />
                        </TableCell>
                        <TableCell>{formatCurrency(order.estimated_total)}</TableCell>
                        <TableCell>{new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small" variant="text" onClick={() => navigate('/order-history')}>
              View all orders
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Sales + Product performance */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: COLORS.border, boxShadow: cardShadow, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ink }}>
                Sales Overview
              </Typography>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Range</InputLabel>
                <Select value={range} label="Range" onChange={(e) => setRange(e.target.value)}>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="yesterday">Yesterday</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="monthly">This Month</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {range === 'custom' && (
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  label="From"
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 220 }}
                />
                <TextField
                  size="small"
                  label="To"
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 220 }}
                />
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2.5,
                p: 1.75,
                borderRadius: 2,
                bgcolor: '#f8fafc',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.muted }}>
                Selected range
              </Typography>
              <Chip icon={<ShowChart sx={{ fontSize: 18 }} />} label={`Rs. ${activeRangeSummary.toFixed(2)}`} color="primary" variant="filled" sx={{ fontWeight: 700 }} />
            </Box>

            <SalesBar label="Today" value={salesSummary.daily} maxValue={salesMax} color={COLORS.primary} active={range === 'today'} />
            <SalesBar label="Yesterday" value={salesSummary.yesterday} maxValue={salesMax} color="#93a5c9" active={range === 'yesterday'} />
            <SalesBar label="This Week" value={salesSummary.weekly} maxValue={salesMax} color={COLORS.success} active={range === 'week'} />
            <SalesBar label="This Month" value={salesSummary.monthly} maxValue={salesMax} color={COLORS.warning} active={range === 'monthly'} />

            {historyData.length > 0 && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: COLORS.ink }}>
                  Sales Trend
                </Typography>
                <SalesTrendChart data={historyData} />
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: COLORS.border, boxShadow: cardShadow, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ink, mb: 2 }}>
              Product Performance
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <TrendingUp sx={{ fontSize: 18, color: COLORS.success }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                Best Sellers
              </Typography>
            </Box>
            {topProducts.length > 0 ? (
              topProducts.map((item) => <ProductBar key={item.name} label={item.name} value={item.quantity} maxValue={productMax} color={COLORS.success} />)
            ) : (
              <Typography variant="body2" sx={{ color: COLORS.muted, mb: 2 }}>
                No product sales recorded yet.
              </Typography>
            )}

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <TrendingDown sx={{ fontSize: 18, color: COLORS.danger }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                Slow Movers
              </Typography>
            </Box>
            {lowProducts.length > 0 ? (
              lowProducts.map((item) => <ProductBar key={item.name} label={item.name} value={item.quantity} maxValue={productMax} color={COLORS.danger} />)
            ) : (
              <Typography variant="body2" sx={{ color: COLORS.muted }}>
                All products are moving well.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;