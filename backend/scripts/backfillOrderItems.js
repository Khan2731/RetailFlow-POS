require('dotenv').config();
const db = require('../config/database');

(async () => {
  try {
    console.log('Starting backfill of OrderItems.unit_price using product_variants and product prices...');

    await db.query(`
      UPDATE OrderItems oi
      SET unit_price = COALESCE(
        (
          SELECT pv.price FROM product_variants pv
          WHERE pv.product_id = p.id AND LOWER(pv.size_name) = LOWER(COALESCE(oi.size,''))
          LIMIT 1
        ),
        CASE
          WHEN LOWER(COALESCE(oi.size,'')) = 'small' AND p.small_price IS NOT NULL THEN p.small_price
          WHEN LOWER(COALESCE(oi.size,'')) = 'medium' AND p.medium_price IS NOT NULL THEN p.medium_price
          WHEN LOWER(COALESCE(oi.size,'')) = 'large' AND p.large_price IS NOT NULL THEN p.large_price
          WHEN LOWER(COALESCE(oi.size,'')) = 'xl' AND p.xl_price IS NOT NULL THEN p.xl_price
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

    console.log('Backfill by product completed. Now attempting deal-based backfill...');

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

    console.log('Backfill complete');
  } catch (err) {
    console.error('Backfill failed:', err.message || err);
  } finally {
    process.exit(0);
  }
})();
