-- ============================================================
-- Migration 006: Add shop_name column to customers table
-- ============================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS shop_name VARCHAR(255) AFTER full_name;

-- ============================================================
-- Done. Customers can now have a shop/business name.
-- ============================================================
