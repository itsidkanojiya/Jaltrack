-- ============================================================
-- Migration 009: Salary - amount_paid (udhar) for tracking payments to delivery boys
-- ============================================================

ALTER TABLE salary ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER total_amount;

-- ============================================================
-- Done. Salary rows can track how much was paid (udhar); pending = total - amount_paid.
-- ============================================================
