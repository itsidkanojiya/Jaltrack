-- ============================================================
-- Migration 004: Multi-Tenant SaaS Architecture
-- ============================================================

-- 1. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  price_monthly         DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_customers         INT NOT NULL DEFAULT 50,
  max_delivery_boys     INT NOT NULL DEFAULT 1,
  feature_expenses      BOOLEAN DEFAULT TRUE,
  feature_events        BOOLEAN DEFAULT TRUE,
  feature_jug_tracking  BOOLEAN DEFAULT TRUE,
  feature_spot_supply   BOOLEAN DEFAULT TRUE,
  feature_client_portal BOOLEAN DEFAULT TRUE,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subscription_plans (name, price_monthly, max_customers, max_delivery_boys, feature_expenses, feature_events, feature_jug_tracking, feature_spot_supply, feature_client_portal) VALUES
  ('Starter',    999.00, 50,    1,  FALSE, FALSE, TRUE,  TRUE,  FALSE),
  ('Growth',    2499.00, 200,   5,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE),
  ('Enterprise',4999.00, 99999, 99999, TRUE, TRUE, TRUE, TRUE, TRUE);

-- 2. Businesses (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(200) NOT NULL,
  owner_name            VARCHAR(150),
  email                 VARCHAR(150),
  phone                 VARCHAR(20),
  city                  VARCHAR(100),
  address               TEXT,
  status                ENUM('active','suspended','trial') DEFAULT 'trial',
  plan_id               INT,
  subscription_start    DATE,
  subscription_expiry   DATE,
  payment_status        ENUM('paid','pending','overdue') DEFAULT 'pending',
  max_customers         INT DEFAULT 50,
  max_delivery_boys     INT DEFAULT 1,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
);

-- Default business for existing data
INSERT INTO businesses (id, name, owner_name, status, plan_id, subscription_start, subscription_expiry, payment_status, max_customers, max_delivery_boys)
VALUES (1, 'Default Business', 'Admin', 'active', 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'paid', 200, 5);

-- 3. Leads (CRM)
CREATE TABLE IF NOT EXISTS leads (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  business_name         VARCHAR(200) NOT NULL,
  contact_person        VARCHAR(150),
  phone                 VARCHAR(20),
  email                 VARCHAR(150),
  city                  VARCHAR(100),
  status                ENUM('new','demo_done','converted','lost') DEFAULT 'new',
  notes                 TEXT,
  follow_up_date        DATE,
  converted_business_id INT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (converted_business_id) REFERENCES businesses(id) ON DELETE SET NULL
);

-- 4. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  title                 VARCHAR(200) NOT NULL,
  message               TEXT NOT NULL,
  target                ENUM('all','specific') DEFAULT 'all',
  business_id           INT,
  created_by            INT,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- 5. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id               INT,
  user_role             VARCHAR(30),
  business_id           INT,
  action                VARCHAR(100) NOT NULL,
  detail                TEXT,
  ip_address            VARCHAR(50),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_business (business_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
);

-- ============================================================
-- 6. Add business_id to users
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_id INT AFTER role;
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_business (business_id);

-- Backfill existing users to default business
UPDATE users SET business_id = 1 WHERE business_id IS NULL AND role != 'super_admin';

-- ============================================================
-- 7. Add supplier_id to all operational tables
-- ============================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE customers ADD INDEX IF NOT EXISTS idx_customers_supplier (supplier_id);

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE deliveries ADD INDEX IF NOT EXISTS idx_deliveries_supplier (supplier_id);

ALTER TABLE spot_supply ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE spot_supply ADD INDEX IF NOT EXISTS idx_spot_supply_supplier (supplier_id);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE invoices ADD INDEX IF NOT EXISTS idx_invoices_supplier (supplier_id);

ALTER TABLE billing_cycles ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE billing_cycles ADD INDEX IF NOT EXISTS idx_billing_cycles_supplier (supplier_id);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE payments ADD INDEX IF NOT EXISTS idx_payments_supplier (supplier_id);

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE expenses ADD INDEX IF NOT EXISTS idx_expenses_supplier (supplier_id);

ALTER TABLE salary ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE salary ADD INDEX IF NOT EXISTS idx_salary_supplier (supplier_id);

ALTER TABLE supplier_holidays ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE supplier_holidays ADD INDEX IF NOT EXISTS idx_supplier_holidays_supplier (supplier_id);

ALTER TABLE client_holidays ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE client_holidays ADD INDEX IF NOT EXISTS idx_client_holidays_supplier (supplier_id);

ALTER TABLE events ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE events ADD INDEX IF NOT EXISTS idx_events_supplier (supplier_id);

ALTER TABLE event_supply ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE event_supply ADD INDEX IF NOT EXISTS idx_event_supply_supplier (supplier_id);

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE activity_log ADD INDEX IF NOT EXISTS idx_activity_log_supplier (supplier_id);

ALTER TABLE issues ADD COLUMN IF NOT EXISTS supplier_id INT DEFAULT 1;
ALTER TABLE issues ADD INDEX IF NOT EXISTS idx_issues_supplier (supplier_id);

-- Backfill all existing rows to default business
UPDATE customers SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE deliveries SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE spot_supply SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE invoices SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE billing_cycles SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE payments SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE expenses SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE salary SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE supplier_holidays SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE client_holidays SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE events SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE event_supply SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE activity_log SET supplier_id = 1 WHERE supplier_id IS NULL;
UPDATE issues SET supplier_id = 1 WHERE supplier_id IS NULL;

-- ============================================================
-- Done. All existing data preserved under business_id = 1
-- ============================================================
