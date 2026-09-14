require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
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
const attendanceRoutes = require('./routes/attendance');
const salaryAdvanceRoutes = require('./routes/salaryAdvances');
const payrollRoutes = require('./routes/payroll');
const shiftRoutes = require('./routes/shifts');
const vendorRoutes = require('./routes/vendors');
const inventoryMovementRoutes = require('./routes/inventoryMovements');
const db = require('./config/database');
const fs = require('fs');
const path = require('path');

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
app.use('/api/attendance', attendanceRoutes);
app.use('/api/salary-advances', salaryAdvanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/inventory-movements', inventoryMovementRoutes);

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

const ensureProductXLColumn = async () => {
  try {
    await db.query('ALTER TABLE Products ADD COLUMN IF NOT EXISTS xl_price NUMERIC(10, 2)');
  } catch (err) {
    console.error('Failed to ensure XL price column:', err.message || err);
  }
};

const ensureProductVariantsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
        size_name TEXT NOT NULL,
        price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id)');
  } catch (err) {
    console.error('Failed to ensure product variants table:', err.message || err);
  }
};

const backfillProductVariants = async () => {
  try {
    await db.query(`
      INSERT INTO product_variants (product_id, size_name, price, active)
      SELECT p.id, 'Small', p.small_price, TRUE
      FROM Products p
      WHERE p.has_sizes = TRUE
        AND COALESCE(p.small_price, 0) > 0
        AND NOT EXISTS (
          SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND LOWER(pv.size_name) = 'small'
        )
    `);

    await db.query(`
      INSERT INTO product_variants (product_id, size_name, price, active)
      SELECT p.id, 'Medium', p.medium_price, TRUE
      FROM Products p
      WHERE p.has_sizes = TRUE
        AND COALESCE(p.medium_price, 0) > 0
        AND NOT EXISTS (
          SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND LOWER(pv.size_name) = 'medium'
        )
    `);

    await db.query(`
      INSERT INTO product_variants (product_id, size_name, price, active)
      SELECT p.id, 'Large', p.large_price, TRUE
      FROM Products p
      WHERE p.has_sizes = TRUE
        AND COALESCE(p.large_price, 0) > 0
        AND NOT EXISTS (
          SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND LOWER(pv.size_name) = 'large'
        )
    `);

    await db.query(`
      INSERT INTO product_variants (product_id, size_name, price, active)
      SELECT p.id, 'XL', p.xl_price, TRUE
      FROM Products p
      WHERE p.has_sizes = TRUE
        AND COALESCE(p.xl_price, 0) > 0
        AND NOT EXISTS (
          SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND LOWER(pv.size_name) = 'xl'
        )
    `);
  } catch (err) {
    console.error('Failed to backfill product variants:', err.message || err);
  }
};

const ensureCalzoneProduct = async () => {
  try {
    const existing = await db.query('SELECT id FROM Products WHERE name ILIKE $1', ['%calzone%']);
    if (existing.rows.length) return;

    await db.query(`
      INSERT INTO Products (name, category, base_price, has_sizes, small_price, medium_price, large_price, xl_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, ['Calzone Pizza', 'Pizza', 1400, true, 1200, 1400, 1600, 1800]);
  } catch (err) {
    console.error('Failed to ensure Calzone product:', err.message || err);
  }
};

const ensureInventoryPriceColumn = async () => {
  try {
    await db.query('ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0');
  } catch (err) {
    console.error('Failed to ensure inventory price column:', err.message || err);
  }
};

const ensureStaffColumns = async () => {
  try {
    await db.query('ALTER TABLE Staff ADD COLUMN IF NOT EXISTS salary NUMERIC(10, 2) DEFAULT 0');
    await db.query('ALTER TABLE Staff ADD COLUMN IF NOT EXISTS phone TEXT');
    await db.query('ALTER TABLE Staff ADD COLUMN IF NOT EXISTS email TEXT');
    await db.query('ALTER TABLE Staff ADD COLUMN IF NOT EXISTS notes TEXT');
  } catch (err) {
    console.error('Failed to ensure staff columns:', err.message || err);
  }
};

const ensureOrderTypeColumn = async () => {
  try {
    await db.query('ALTER TABLE Orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT \'dine_in\'');
  } catch (err) {
    console.error('Failed to ensure order type column:', err.message || err);
  }
};

const ensureOrderCancellationAndShiftColumns = async () => {
  try {
    await db.query('ALTER TABLE Orders ADD COLUMN IF NOT EXISTS business_date DATE');
    await db.query('ALTER TABLE Orders ADD COLUMN IF NOT EXISTS shift_id INTEGER');
    await db.query('ALTER TABLE Orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT');
    await db.query('ALTER TABLE Orders ADD COLUMN IF NOT EXISTS cancelled_by INTEGER');
    await db.query('ALTER TABLE Orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP');
    await db.query(`
      CREATE TABLE IF NOT EXISTS Shifts (
        id SERIAL PRIMARY KEY,
        cashier_id INTEGER NOT NULL REFERENCES Staff(id) ON DELETE CASCADE,
        business_date DATE NOT NULL,
        start_time TIMESTAMP NOT NULL DEFAULT now(),
        close_time TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'open',
        opening_cash NUMERIC(10, 2) DEFAULT 0,
        closing_cash NUMERIC(10, 2),
        expected_cash NUMERIC(10, 2),
        cash_difference NUMERIC(10, 2),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS idx_shifts_cashier_id ON Shifts(cashier_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_shifts_business_date ON Shifts(business_date)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_shifts_status ON Shifts(status)');
  } catch (err) {
    console.error('Failed to ensure order cancellation and shift columns:', err.message || err);
  }
};

const ensureOrderItemColumns = async () => {
  try {
    await db.query('ALTER TABLE OrderItems ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2) DEFAULT 0');
    await db.query('ALTER TABLE OrderItems ADD COLUMN IF NOT EXISTS size TEXT');
    await db.query('ALTER TABLE OrderItems ADD COLUMN IF NOT EXISTS item_name TEXT');
    await db.query('ALTER TABLE OrderItems ADD COLUMN IF NOT EXISTS is_deal BOOLEAN DEFAULT false');
    await db.query('ALTER TABLE OrderItems ADD COLUMN IF NOT EXISTS deal_name TEXT');
  } catch (err) {
    console.error('Failed to ensure order item pricing columns:', err.message || err);
  }
};

const backfillOrderItemPricing = async () => {
  try {
    await db.query(`
      UPDATE OrderItems oi
      SET unit_price = COALESCE(
        oi.unit_price,
        CASE
          WHEN oi.size = 'small' AND p.small_price IS NOT NULL THEN p.small_price
          WHEN oi.size = 'medium' AND p.medium_price IS NOT NULL THEN p.medium_price
          WHEN oi.size = 'large' AND p.large_price IS NOT NULL THEN p.large_price
          WHEN oi.size = 'xl' AND p.xl_price IS NOT NULL THEN p.xl_price
          ELSE p.base_price
        END,
        p.base_price,
        0
      ),
      item_name = COALESCE(oi.item_name, p.name),
      is_deal = COALESCE(oi.is_deal, false)
      FROM Products p
      WHERE oi.product_id = p.id
        AND (oi.unit_price IS NULL OR oi.unit_price = 0)
    `);

    await db.query(`
      UPDATE OrderItems oi
      SET unit_price = COALESCE(oi.unit_price, d.deal_price, 0),
          item_name = COALESCE(oi.item_name, d.name),
          deal_name = COALESCE(oi.deal_name, d.name),
          is_deal = true
      FROM Deals d
      WHERE (oi.unit_price IS NULL OR oi.unit_price = 0)
        AND (
          COALESCE(oi.item_name, '') ILIKE d.name
          OR COALESCE(oi.deal_name, '') ILIKE d.name
        )
    `);

    await db.query(`
      UPDATE OrderItems
      SET unit_price = COALESCE(unit_price, 0)
      WHERE unit_price IS NULL
    `);
  } catch (err) {
    console.error('Failed to backfill historical order item pricing:', err.message || err);
  }
};

// Ensure schema exists and default manager on startup
(async () => {
  try {
    // Run attendance/payroll migration
    const migrationPath = path.join(__dirname, 'migrations', 'attendance_payroll.sql');
    if (fs.existsSync(migrationPath)) {
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      await db.query(migrationSql);
    }
    // Run vendor/inventory upgrade migration
    const vendorMigrationPath = path.join(__dirname, 'migrations', 'vendor_inventory_upgrade.sql');
    if (fs.existsSync(vendorMigrationPath)) {
      const vendorMigrationSql = fs.readFileSync(vendorMigrationPath, 'utf8');
      await db.query(vendorMigrationSql);
    }
    await ensureDealItemSizeColumn();
    await ensureProductXLColumn();
    await ensureProductVariantsTable();
    await backfillProductVariants();
    await ensureCalzoneProduct();
    await ensureInventoryPriceColumn();
    await ensureStaffColumns();
    await ensureOrderTypeColumn();
    await ensureOrderCancellationAndShiftColumns();
    await ensureOrderItemColumns();
    await backfillOrderItemPricing();
    await ensureDefaultManager();
  } catch (err) {
    console.error('Startup DB initialization failed:', err.message || err);
  }
})();

app.use(notFound);
app.use(errorHandler);

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`PizzaHub POS Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
      if (port === PORT) {
        const fallback = port + 1;
        console.log(`Trying fallback port ${fallback}...`);
        startServer(fallback);
      } else {
        console.error('No available ports found. Please stop the process using this port or set a different PORT.');
        process.exit(1);
      }
    } else {
      console.error('Server startup error:', err.message || err);
      process.exit(1);
    }
  });
};

if (require.main === module) {
  startServer(PORT);
}

module.exports = app;
