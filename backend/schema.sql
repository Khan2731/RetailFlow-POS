-- PizzaHub POS System Database Schema

-- Products table
CREATE TABLE IF NOT EXISTS Products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    has_sizes BOOLEAN DEFAULT false,
    small_price NUMERIC(10, 2),
    medium_price NUMERIC(10, 2),
    large_price NUMERIC(10, 2),
    xl_price NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    size_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- Deals table
CREATE TABLE IF NOT EXISTS Deals (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    deal_price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- DealItems table (products included in a deal)
CREATE TABLE IF NOT EXISTS DealItems (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    size TEXT,
    FOREIGN KEY (deal_id) REFERENCES Deals(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS Orders (
    id SERIAL PRIMARY KEY,
    table_no INTEGER NOT NULL,
    waiter_name TEXT NOT NULL,
    order_time TIMESTAMP DEFAULT now(),
    status TEXT DEFAULT 'pending',
    order_type TEXT DEFAULT 'dine_in',
    business_date DATE,
    shift_id INTEGER,
    cancellation_reason TEXT,
    cancelled_by INTEGER,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- OrderItems table
CREATE TABLE IF NOT EXISTS OrderItems (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- Billing table
CREATE TABLE IF NOT EXISTS Billing (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
);

-- Expenses table
CREATE TABLE IF NOT EXISTS Expenses (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date TIMESTAMP DEFAULT now(),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Staff table
CREATE TABLE IF NOT EXISTS Staff (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    shift TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS Inventory (
    id SERIAL PRIMARY KEY,
    item_name TEXT NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Delivery table
CREATE TABLE IF NOT EXISTS Delivery (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    driver_name TEXT,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_table_no ON Orders(table_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON Orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON OrderItems(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON OrderItems(product_id);
CREATE INDEX IF NOT EXISTS idx_billing_order_id ON Billing(order_id);
CREATE INDEX IF NOT EXISTS idx_staff_username ON Staff(username);
CREATE INDEX IF NOT EXISTS idx_staff_role ON Staff(role);
CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON Inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_delivery_order_id ON Delivery(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON Delivery(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON Products(category);
CREATE INDEX IF NOT EXISTS idx_deals_active ON Deals(is_active);
CREATE INDEX IF NOT EXISTS idx_deal_items_deal_id ON DealItems(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_product_id ON DealItems(product_id);
