-- Jaltrack Migration 002: Delivery Boy RBAC support
-- Run AFTER migration-001.sql has been applied.
-- ================================================================

-- 1) Add delivery_boy_id to spot_supply for ownership tracking
ALTER TABLE spot_supply ADD COLUMN delivery_boy_id INT AFTER supply_date;
ALTER TABLE spot_supply ADD CONSTRAINT fk_spot_supply_delivery_boy
  FOREIGN KEY (delivery_boy_id) REFERENCES users(id) ON DELETE SET NULL;

-- 2) Indexes for delivery boy queries
CREATE INDEX idx_spot_supply_boy ON spot_supply(delivery_boy_id);
CREATE INDEX idx_deliveries_boy ON deliveries(delivery_boy_id);
