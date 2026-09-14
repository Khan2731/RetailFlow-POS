(require('dotenv').config());
const db = require('../config/database');
(async () => {
  try {
    const res1 = await db.query("SELECT COUNT(*) FROM OrderItems WHERE COALESCE(unit_price,0)=0");
    const res2 = await db.query('SELECT COUNT(*) FROM OrderItems WHERE unit_price IS NULL');
    const res3 = await db.query('SELECT oi.order_id, COUNT(*) as cnt, SUM(COALESCE(oi.unit_price,0)*oi.quantity) as sum FROM OrderItems oi GROUP BY oi.order_id ORDER BY sum ASC LIMIT 20');
    console.log('orderitems_unitprice_zero=', res1.rows[0].count);
    console.log('orderitems_unitprice_null=', res2.rows[0].count);
    console.log('sample_order_sums=');
    console.table(res3.rows);
  } catch (err) {
    console.error('check failed', err);
  } finally {
    process.exit(0);
  }
})();
