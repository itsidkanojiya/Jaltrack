-- Jaltrack: Water Jug Management System
-- =====================================
-- POSTGRESQL ONLY – do not run in MySQL.
-- For MySQL use: schema-mysql.sql
-- =====================================

-- Users (Admin, Delivery Boy)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'delivery_boy')),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers (subscribers)
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  rate_per_jug DECIMAL(10, 2) NOT NULL,
  joining_date DATE NOT NULL,
  holiday_billing_chargeable BOOLEAN DEFAULT true,
  pending_jugs INTEGER DEFAULT 0,
  outstanding DECIMAL(12, 2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier holidays (NOT billable; no delivery)
CREATE TABLE IF NOT EXISTS supplier_holidays (
  id SERIAL PRIMARY KEY,
  holiday_date DATE NOT NULL UNIQUE,
  reason VARCHAR(255),
  message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client holidays (billable continues; for reference only)
CREATE TABLE IF NOT EXISTS client_holidays (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries (regular route)
CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  delivery_date DATE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  delivery_boy_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  jugs_out INTEGER NOT NULL DEFAULT 0,
  empty_in INTEGER NOT NULL DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'Pending' CHECK (payment_status IN ('Paid', 'Pending', 'UPI', 'Cash')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spot supply (non-contract)
CREATE TABLE IF NOT EXISTS spot_supply (
  id SERIAL PRIMARY KEY,
  supply_date DATE NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  jugs_given INTEGER NOT NULL,
  amount DECIMAL(12, 2),
  payment_mode VARCHAR(50) DEFAULT 'Pending' CHECK (payment_mode IN ('Cash', 'UPI', 'Pending')),
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing cycles and invoices (monthly)
CREATE TABLE IF NOT EXISTS billing_cycles (
  id SERIAL PRIMARY KEY,
  cycle_month INTEGER NOT NULL,
  cycle_year INTEGER NOT NULL,
  UNIQUE(cycle_month, cycle_year)
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  billing_cycle_id INTEGER REFERENCES billing_cycles(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  total_days INTEGER NOT NULL,
  supplier_hol_days INTEGER NOT NULL DEFAULT 0,
  client_hol_days INTEGER NOT NULL DEFAULT 0,
  chargeable_days INTEGER NOT NULL,
  rate_per_jug DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments & reminders (Promise Date)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE,
  promise_date DATE,
  mode VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  expense_date DATE NOT NULL,
  category VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary (delivery boys)
CREATE TABLE IF NOT EXISTS salary (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('daily', 'monthly')),
  days_worked INTEGER,
  rate_per_day DECIMAL(10, 2),
  fixed_amount DECIMAL(12, 2),
  total_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log (for dashboard recent activity)
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  activity_date TIMESTAMPTZ NOT NULL,
  type VARCHAR(50) NOT NULL,
  customer_or_location VARCHAR(255),
  amount_or_jugs VARCHAR(100),
  status VARCHAR(50),
  reference_id INTEGER,
  reference_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_spot_supply_date ON spot_supply(supply_date);
CREATE INDEX IF NOT EXISTS idx_invoices_cycle ON invoices(billing_cycle_id);
CREATE INDEX IF NOT EXISTS idx_supplier_holidays_date ON supplier_holidays(holiday_date);
