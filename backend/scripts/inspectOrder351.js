require('dotenv').config();
const db = require('../config/database');
(async () => {
  try {
    const r = await db.query('SELECT * FROM OrderItems WHERE order_id=$1', [351]);
    console.log('OrderItems for order 351:');
    console.table(r.rows);
    for (const oi of r.rows) {
      const p = await db.query('SELECT id,name,base_price,small_price,medium_price,large_price,xl_price FROM Products WHERE id=$1', [oi.product_id]);
      console.log('Product:', p.rows[0]);
      const pv = await db.query('SELECT * FROM product_variants WHERE product_id=$1', [oi.product_id]);
      console.log('Variants:');
      console.table(pv.rows);
    }
  } catch (err) {
    console.error('inspect failed', err);
  } finally {
    process.exit(0);
  }
})();
