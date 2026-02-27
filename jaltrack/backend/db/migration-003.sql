-- Jaltrack Migration 003: Client portal support
-- Run AFTER migration-002.sql has been applied.
-- ================================================================

-- 1) Link users to customers (for client role)
ALTER TABLE users ADD COLUMN customer_id INT AFTER role;
ALTER TABLE users ADD CONSTRAINT fk_users_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- 2) Issues / support tickets table
CREATE TABLE IF NOT EXISTS issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Open',
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_issues_customer ON issues(customer_id);
