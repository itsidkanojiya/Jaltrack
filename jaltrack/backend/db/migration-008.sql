-- ============================================================
-- Migration 008: Add optional advance_pay to events
-- ============================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS advance_pay DECIMAL(12,2) NULL AFTER deposit;

-- ============================================================
-- Done. Events can now have an optional advance pay amount.
-- ============================================================
