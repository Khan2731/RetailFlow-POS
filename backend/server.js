require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const orderItemRoutes = require('./routes/orderItems');
const billingRoutes = require('./routes/billing');
const staffRoutes = require('./routes/staff');
const inventoryRoutes = require('./routes/inventory');
const deliveryRoutes = require('./routes/delivery');
const dealRoutes = require('./routes/deals');
const expenseRoutes = require('./routes/expenses');
const settingsRoutes = require('./routes/settings');
const db = require('./config/database');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'PizzaHub POS System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      orderItems: '/api/order-items',
      billing: '/api/billing',
      expenses: '/api/expenses',
      staff: '/api/staff',
      inventory: '/api/inventory',
      delivery: '/api/delivery',
      deals: '/api/deals'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settings', settingsRoutes);

const ensureDefaultManager = async () => {
  try {
    const checkSql = 'SELECT COUNT(*) as count FROM Staff WHERE username = $1';
    const res = await db.query(checkSql, ['sabirkhan']);
    const count = res.rows[0] ? parseInt(res.rows[0].count, 10) : 0;
    if (!count) {
      const defaultManager = {
        name: 'Sabir Khan',
        username: 'sabirkhan',
        password: 'Khan2731',
        role: 'manager',
        shift: 'morning',
      };
      const hash = await bcrypt.hash(defaultManager.password, 10);
      const insertSql = 'INSERT INTO Staff (name, username, password, role, shift) VALUES ($1, $2, $3, $4, $5)';
      await db.query(insertSql, [defaultManager.name, defaultManager.username, hash, defaultManager.role, defaultManager.shift]);
      console.log('Default manager user created: sabirkhan / Khan2731');
    }
  } catch (err) {
    console.error('Failed to ensure default manager user:', err.message || err);
  }
};

const ensureDealItemSizeColumn = async () => {
  try {
    await db.query('ALTER TABLE DealItems ADD COLUMN IF NOT EXISTS size TEXT');
  } catch (err) {
    console.error('Failed to ensure deal item size column:', err.message || err);
  }
};

// Ensure schema exists and default manager on startup
(async () => {
  try {
    await ensureDealItemSizeColumn();
    await ensureDefaultManager();
  } catch (err) {
    console.error('Startup DB initialization failed:', err.message || err);
  }
})();

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`PizzaHub POS Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
