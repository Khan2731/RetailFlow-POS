require('dotenv').config();
const db = require('../config/database');
(async () => {
  try {
    const q = `SELECT oi.id as orderitem_id, oi.order_id, oi.product_id, oi.size, oi.item_name, oi.is_deal,
                      p.name as product_name, p.base_price, p.small_price, p.medium_price, p.large_price, p.xl_price,
                      pv.id as variant_id, pv.size_name as variant_size, pv.price as variant_price
               FROM OrderItems oi
               LEFT JOIN Products p ON oi.product_id = p.id
               LEFT JOIN LATERAL (
                 SELECT * FROM product_variants pv2 WHERE pv2.product_id = oi.product_id AND LOWER(pv2.size_name)=LOWER(COALESCE(oi.size,'')) LIMIT 1
               ) pv ON true
               WHERE oi.unit_price = 0
               LIMIT 50`;
    const res = await db.query(q);
    console.log('Sample zero-priced OrderItems with product/variant info:');
    console.table(res.rows);
  } catch (err) {
    console.error('diagnose failed', err);
  } finally { process.exit(0); }
})();
