const db = require('../config/database');
const { getBusinessDate } = require('../utils/pakistanTime');

const getDashboardAnalytics = async (req, res) => {
  try {
    const {
      from,
      to,
      shift_id: shiftId,
      cashier_id: cashierId,
      status,
      category,
      product_id: productId,
    } = req.query;
    const values = [];
    const conditions = [];
    const add = (value) => { values.push(value); return `$${values.length}`; };

    if (from) conditions.push(`o.business_date >= ${add(from)}::date`);
    if (to) conditions.push(`o.business_date <= ${add(to)}::date`);
    if (shiftId) conditions.push(`o.shift_id = ${add(Number(shiftId))}`);
    if (cashierId) conditions.push(`s.id = ${add(Number(cashierId))}`);
    if (status) conditions.push(`o.status = ${add(status)}`);
    if (category) conditions.push(`p.category = ${add(category)}`);
    if (productId) conditions.push(`oi.product_id = ${add(Number(productId))}`);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const completedWhere = conditions.length
      ? `${where} AND o.status = 'completed'`
      : `WHERE o.status = 'completed'`;

    const [summary, todaySales, trend, products, categories, hourly, cashiers, shifts, recent, cancellationReasons] = await Promise.all([
      db.query(`
        WITH filtered_orders AS (
          SELECT DISTINCT o.id, o.status
          FROM Orders o
          LEFT JOIN OrderItems oi ON oi.order_id = o.id
          LEFT JOIN Products p ON p.id = oi.product_id
          LEFT JOIN Shifts sh ON sh.id = o.shift_id
          LEFT JOIN Staff s ON s.id = sh.cashier_id
          ${where}
        ), order_totals AS (
          SELECT fo.id, fo.status, COALESCE(b.total, 0) AS total
          FROM filtered_orders fo LEFT JOIN Billing b ON b.order_id = fo.id
        ), item_totals AS (
          SELECT fo.id, COALESCE(SUM(oi.quantity), 0) AS quantity
          FROM filtered_orders fo LEFT JOIN OrderItems oi ON oi.order_id = fo.id
          GROUP BY fo.id
        )
        SELECT COUNT(*)::int AS total_orders,
               COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_orders,
               COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_orders,
               COALESCE(SUM(total) FILTER (WHERE status = 'completed'), 0) AS revenue,
               COALESCE(SUM(item_totals.quantity) FILTER (WHERE order_totals.status = 'completed'), 0)::int AS products_sold,
               COALESCE(AVG(total) FILTER (WHERE status = 'completed'), 0) AS average_order_value
        FROM order_totals JOIN item_totals ON item_totals.id = order_totals.id`, values),
      db.query(`
        SELECT COALESCE(SUM(b.total), 0) AS revenue
        FROM Orders o
        LEFT JOIN Billing b ON b.order_id = o.id
        WHERE o.status = 'completed' AND o.business_date = $1::date`,
      [getBusinessDate()]),
      db.query(`
        WITH filtered AS (
          SELECT DISTINCT o.id, o.business_date
          FROM Orders o
          LEFT JOIN OrderItems oi ON oi.order_id = o.id
          LEFT JOIN Products p ON p.id = oi.product_id
          LEFT JOIN Shifts sh ON sh.id = o.shift_id
          LEFT JOIN Staff s ON s.id = sh.cashier_id
          ${completedWhere}
        )
        SELECT f.business_date::text AS business_date, COUNT(*)::int AS orders,
               COALESCE(SUM(b.total), 0) AS revenue
        FROM filtered f LEFT JOIN Billing b ON b.order_id = f.id
        GROUP BY f.business_date ORDER BY f.business_date`, values),
      db.query(`
        SELECT COALESCE(p.name, oi.item_name, 'Unknown') AS product,
               p.category,
               COALESCE(NULLIF(LOWER(oi.size), ''), 'standard') AS size,
               COALESCE(SUM(oi.quantity), 0)::int AS quantity_sold,
               COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
               COUNT(DISTINCT oi.order_id)::int AS orders,
               MAX(o.order_time)::text AS last_sold
        FROM OrderItems oi
        JOIN Orders o ON o.id = oi.order_id
        LEFT JOIN Products p ON p.id = oi.product_id
        LEFT JOIN Shifts sh ON sh.id = o.shift_id
        LEFT JOIN Staff s ON s.id = sh.cashier_id
        ${completedWhere}
        GROUP BY p.name, oi.item_name, p.category, COALESCE(NULLIF(LOWER(oi.size), ''), 'standard')
        ORDER BY quantity_sold DESC, revenue DESC`, values),
      db.query(`
        SELECT COALESCE(p.category, 'Uncategorized') AS category,
               COALESCE(SUM(oi.quantity), 0)::int AS quantity_sold,
               COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
               COUNT(DISTINCT oi.order_id)::int AS orders
        FROM OrderItems oi
        JOIN Orders o ON o.id = oi.order_id
        LEFT JOIN Products p ON p.id = oi.product_id
        LEFT JOIN Shifts sh ON sh.id = o.shift_id
        LEFT JOIN Staff s ON s.id = sh.cashier_id
        ${completedWhere}
        GROUP BY p.category ORDER BY revenue DESC`, values),
      db.query(`
        WITH filtered AS (
          SELECT DISTINCT o.id, o.business_date, o.order_time
          FROM Orders o
          LEFT JOIN OrderItems oi ON oi.order_id = o.id
          LEFT JOIN Products p ON p.id = oi.product_id
          LEFT JOIN Shifts sh ON sh.id = o.shift_id
          LEFT JOIN Staff s ON s.id = sh.cashier_id
          ${completedWhere}
        )
         SELECT f.business_date::text AS business_date,
           EXTRACT(HOUR FROM f.order_time)::int AS hour, COUNT(*)::int AS orders,
               COALESCE(SUM(b.total), 0) AS revenue
        FROM filtered f LEFT JOIN Billing b ON b.order_id = f.id
        GROUP BY f.business_date, hour ORDER BY f.business_date, hour`, values),
      db.query(`
        WITH filtered AS (
          SELECT DISTINCT o.id, o.status, s.id AS cashier_id, s.name AS cashier
          FROM Orders o
          LEFT JOIN OrderItems oi ON oi.order_id = o.id
          LEFT JOIN Products p ON p.id = oi.product_id
          LEFT JOIN Shifts sh ON sh.id = o.shift_id
          LEFT JOIN Staff s ON s.id = sh.cashier_id
          ${where}
        )
        SELECT f.cashier_id, f.cashier, COUNT(*)::int AS orders,
               COUNT(*) FILTER (WHERE f.status = 'cancelled')::int AS cancelled_orders,
               COALESCE(SUM(b.total) FILTER (WHERE f.status = 'completed'), 0) AS revenue,
               COALESCE(AVG(b.total) FILTER (WHERE f.status = 'completed'), 0) AS average_order_value
        FROM filtered f LEFT JOIN Billing b ON b.order_id = f.id
        GROUP BY f.cashier_id, f.cashier ORDER BY revenue DESC`, values),
      db.query(`
         SELECT sh.id, sh.business_date::text AS business_date, sh.start_time::text AS start_time,
           sh.close_time::text AS close_time, sh.status, s.name AS cashier,
           sh.opening_cash, sh.closing_cash, sh.expected_cash, sh.cash_difference,
               COUNT(DISTINCT o.id) AS orders,
               COALESCE(SUM(b.total) FILTER (WHERE o.status = 'completed'), 0) AS revenue,
               COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'cancelled') AS cancelled_orders
        FROM Shifts sh
        JOIN Staff s ON s.id = sh.cashier_id
        LEFT JOIN Orders o ON o.shift_id = sh.id
        LEFT JOIN Billing b ON b.order_id = o.id
        GROUP BY sh.id, s.name ORDER BY sh.start_time DESC LIMIT 25`),
      db.query(`
        SELECT o.id, o.business_date::text AS business_date, o.order_time::text AS order_time,
           o.status, o.order_type, o.waiter_name, o.shift_id,
           o.cancellation_reason, s.name AS cashier, COALESCE(b.total, 0) AS total,
               b.payment_method, COUNT(oi.id)::int AS item_lines
        FROM Orders o
        LEFT JOIN Billing b ON b.order_id = o.id
        LEFT JOIN OrderItems oi ON oi.order_id = o.id
         LEFT JOIN Shifts sh ON sh.id = o.shift_id
         LEFT JOIN Staff s ON s.id = sh.cashier_id
         ${completedWhere}
        GROUP BY o.id, s.name, b.total, b.payment_method
        ORDER BY o.order_time DESC LIMIT 25`, values),
            db.query(`
         SELECT COALESCE(NULLIF(TRIM(o.cancellation_reason), ''), 'Other') AS reason,
           COUNT(DISTINCT o.id)::int AS count
         FROM Orders o
         LEFT JOIN OrderItems oi ON oi.order_id = o.id
         LEFT JOIN Products p ON p.id = oi.product_id
         LEFT JOIN Shifts sh ON sh.id = o.shift_id
         LEFT JOIN Staff s ON s.id = sh.cashier_id
         ${where ? `${where} AND` : 'WHERE'} o.status = 'cancelled'
         GROUP BY COALESCE(NULLIF(TRIM(o.cancellation_reason), ''), 'Other')
         ORDER BY count DESC`, values),
    ]);

    res.json({
      timezone: 'Asia/Karachi',
      summary: { ...summary.rows[0], today_revenue: todaySales.rows[0]?.revenue || 0 },
      trend: trend.rows,
      products: products.rows,
      top_products: products.rows.slice(0, 10),
      least_products: [...products.rows].sort((a, b) => Number(a.quantity_sold) - Number(b.quantity_sold)).slice(0, 10),
      categories: categories.rows,
      hourly: hourly.rows,
      cashiers: cashiers.rows,
      shifts: shifts.rows,
      recent_orders: recent.rows,
      cancellation_reasons: cancellationReasons.rows,
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to load dashboard analytics' });
  }
};

module.exports = { getDashboardAnalytics };
