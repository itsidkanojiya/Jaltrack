-- Jaltrack: Water Jug Management System (MySQL)
-- ============================================
-- RUN THIS FILE FIRST to create all tables.
-- In phpMyAdmin: select your database, then Import this file or paste and Run.
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  rate_per_jug DECIMAL(10, 2) NOT NULL,
  joining_date DATE NOT NULL,
  holiday_billing_chargeable TINYINT(1) DEFAULT 1,
  pending_jugs INT DEFAULT 0,
  outstanding DECIMAL(12, 2) DEFAULT 0,
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  holiday_date DATE NOT NULL UNIQUE,
  reason VARCHAR(255),
  message_preview TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  holiday_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_date DATE NOT NULL,
  customer_id INT,
  delivery_boy_id INT,
  jugs_out INT NOT NULL DEFAULT 0,
  empty_in INT NOT NULL DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'Pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (delivery_boy_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS spot_supply (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supply_date DATE NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  jugs_given INT NOT NULL,
  amount DECIMAL(12, 2),
  payment_mode VARCHAR(50) DEFAULT 'Pending',
  internal_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_cycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cycle_month INT NOT NULL,
  cycle_year INT NOT NULL,
  UNIQUE KEY uq_cycle (cycle_month, cycle_year)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  billing_cycle_id INT,
  customer_id INT,
  total_days INT NOT NULL,
  supplier_hol_days INT NOT NULL DEFAULT 0,
  client_hol_days INT NOT NULL DEFAULT 0,
  chargeable_days INT NOT NULL,
  rate_per_jug DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE,
  promise_date DATE,
  mode VARCHAR(50),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_date DATE NOT NULL,
  category VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  days_worked INT,
  rate_per_day DECIMAL(10, 2),
  fixed_amount DECIMAL(12, 2),
  total_amount DECIMAL(12, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_date DATETIME NOT NULL,
  type VARCHAR(50) NOT NULL,
  customer_or_location VARCHAR(255),
  amount_or_jugs VARCHAR(100),
  status VARCHAR(50),
  reference_id INT,
  reference_type VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deliveries_date ON deliveries(delivery_date);
CREATE INDEX idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX idx_spot_supply_date ON spot_supply(supply_date);
CREATE INDEX idx_invoices_cycle ON invoices(billing_cycle_id);
CREATE INDEX idx_supplier_holidays_date ON supplier_holidays(holiday_date);
