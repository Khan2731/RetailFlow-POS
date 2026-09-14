require('dotenv').config();
const db = require('../config/database');
(async () => {
  try {
    console.log('Updating OrderItems for product 53...');
    await db.query('BEGIN');
    const res = await db.query(
      `UPDATE OrderItems oi
       SET unit_price = p.base_price
       FROM Products p
       WHERE oi.product_id = p.id
         AND p.id = $1
         AND (oi.unit_price IS NULL OR oi.unit_price = 0)
       RETURNING oi.*`,
      [53]
    );
    await db.query('COMMIT');
    console.log('Updated rows:', res.rowCount);
    const r = await db.query('SELECT * FROM OrderItems WHERE order_id=$1', [351]);
    console.log('OrderItems for order 351 after update:');
    console.table(r.rows);
    const s = await db.query(
      'SELECT oi.order_id, SUM(COALESCE(oi.unit_price,0)*oi.quantity) as sum FROM OrderItems oi WHERE oi.order_id=$1 GROUP BY oi.order_id',
      [351]
    );
    console.log('Order sums:');
    console.table(s.rows);
  } catch (err) {
    console.error('fix failed', err);
    try { await db.query('ROLLBACK'); } catch(e){}
  } finally {
    process.exit(0);
  }
})();
