-- Jaltrack Migration 001: Add Events, extend Invoices/Payments/Holidays
-- Run AFTER schema-mysql.sql has been applied.
-- ================================================================

-- 1) Events tables
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rate_per_jug DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_supply (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  supply_date DATE NOT NULL,
  jugs_out INT DEFAULT 0,
  jugs_returned INT DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 2) Invoices: add discount / additional / final / remarks
ALTER TABLE invoices ADD COLUMN discount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN additional_charges DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN final_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN remarks TEXT;

-- 3) Payments: add customer_id + status
ALTER TABLE payments ADD COLUMN customer_id INT AFTER invoice_id;
ALTER TABLE payments ADD COLUMN status VARCHAR(50) DEFAULT 'Pending' AFTER mode;
ALTER TABLE payments ADD CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Backfill customer_id from invoices (if any rows exist)
UPDATE payments p
  JOIN invoices i ON i.id = p.invoice_id
SET p.customer_id = i.customer_id
WHERE p.customer_id IS NULL AND p.invoice_id IS NOT NULL;

-- 4) Supplier holidays: support date ranges
ALTER TABLE supplier_holidays ADD COLUMN end_date DATE;
UPDATE supplier_holidays SET end_date = holiday_date WHERE end_date IS NULL;
