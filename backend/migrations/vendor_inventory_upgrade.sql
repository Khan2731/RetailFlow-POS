-- ============================================================
-- Vendor Management + Inventory Upgrade Migration
-- Safe to run multiple times (IF NOT EXISTS everywhere)
-- ============================================================

-- Vendors table
CREATE TABLE IF NOT EXISTS Vendors (
    id SERIAL PRIMARY KEY,
    vendor_code TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Pakistan',
    tax_number TEXT,
    opening_balance NUMERIC(10,2) DEFAULT 0,
    credit_limit NUMERIC(10,2) DEFAULT 0,
    payment_terms TEXT DEFAULT 'immediate',
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Vendor Payments table
CREATE TABLE IF NOT EXISTS VendorPayments (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    reference_number TEXT,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON DELETE CASCADE
);

-- Vendor Purchase History table
CREATE TABLE IF NOT EXISTS VendorPurchases (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL,
    inventory_item_id INTEGER,
    item_name TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    quantity NUMERIC(10,3) NOT NULL,
    unit TEXT,
    unit_price NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES Inventory(id) ON DELETE SET NULL
);

-- Inventory Movements table (Stock In / Out / Adjust / Waste / Return)
CREATE TABLE IF NOT EXISTS InventoryMovements (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER NOT NULL,
    movement_type TEXT NOT NULL, -- stock_in, stock_out, adjustment, wastage, return
    quantity NUMERIC(10,3) NOT NULL,
    previous_quantity NUMERIC(10,3) NOT NULL DEFAULT 0,
    updated_quantity NUMERIC(10,3) NOT NULL DEFAULT 0,
    reason TEXT,
    reference TEXT,
    vendor_id INTEGER,
    purchase_price NUMERIC(10,2),
    movement_date DATE NOT NULL,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (inventory_item_id) REFERENCES Inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON DELETE SET NULL
);

-- Add new columns to Inventory table (safe with IF NOT EXISTS)
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS minimum_quantity NUMERIC(10,3) DEFAULT 10;
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES Vendors(id) ON DELETE SET NULL;
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS storage_location TEXT;
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS notes TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendors_status ON Vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_company ON Vendors(company_name);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor ON VendorPayments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_date ON VendorPayments(payment_date);
CREATE INDEX IF NOT EXISTS idx_vendor_purchases_vendor ON VendorPurchases(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_purchases_date ON VendorPurchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON InventoryMovements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON InventoryMovements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON InventoryMovements(movement_date);
CREATE INDEX IF NOT EXISTS idx_inventory_vendor ON Inventory(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON Inventory(status);
