-- ============================================================
-- Migration 007: Route Management & Planned Delivery Control
-- ============================================================

-- 1. Routes
CREATE TABLE IF NOT EXISTS routes (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(150) NOT NULL,
  route_date            DATE NOT NULL,
  delivery_boy_id       INT NOT NULL,
  supplier_id           INT NOT NULL DEFAULT 1,
  status                ENUM('draft','active','in_progress','completed','cancelled') DEFAULT 'draft',
  started_at            DATETIME NULL,
  completed_at          DATETIME NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_routes_date (route_date),
  INDEX idx_routes_boy (delivery_boy_id),
  INDEX idx_routes_supplier (supplier_id),
  INDEX idx_routes_status (status)
);

-- 2. Route Stops (ordered customer stops with expected + actual)
CREATE TABLE IF NOT EXISTS route_stops (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  route_id                INT NOT NULL,
  customer_id             INT NOT NULL,
  sequence_order          INT NOT NULL DEFAULT 1,
  expected_delivery_qty   INT NOT NULL DEFAULT 0,
  expected_empty_qty       INT NOT NULL DEFAULT 0,
  actual_delivery_qty     INT NULL,
  actual_empty_qty        INT NULL,
  delivery_id             INT NULL,
  confirmed_at            DATETIME NULL,
  payment_status          VARCHAR(50) NULL,
  notes                   TEXT NULL,
  delivery_variance       INT NULL COMMENT 'actual_delivery_qty - expected_delivery_qty',
  empty_variance          INT NULL COMMENT 'actual_empty_qty - expected_empty_qty',
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_route_stops_route (route_id),
  UNIQUE KEY uq_route_sequence (route_id, sequence_order)
);

-- 3. Add route link to deliveries
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS route_id INT NULL AFTER supplier_id;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS route_stop_id INT NULL AFTER route_id;
ALTER TABLE deliveries ADD INDEX IF NOT EXISTS idx_deliveries_route (route_id);

-- ============================================================
-- Done. Routes and route_stops ready; deliveries linked to routes.
-- ============================================================
