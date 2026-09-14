-- Safe indexes for business-date, shift, cancellation, and product analytics.
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS customer_contact TEXT;
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS customer_address TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_business_date ON Orders(business_date);
CREATE INDEX IF NOT EXISTS idx_orders_shift_id ON Orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_time ON Orders(order_time);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON Orders(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product_order ON OrderItems(product_id, order_id);
CREATE INDEX IF NOT EXISTS idx_billing_created_at ON Billing(created_at);
