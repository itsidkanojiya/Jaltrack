-- ============================================================
-- Migration 005: Add username column to users table
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE AFTER email;

-- Set default usernames from email prefix for existing users
UPDATE users SET username = SUBSTRING_INDEX(email, '@', 1) WHERE username IS NULL;

-- ============================================================
-- Done. Users can now login with email OR username.
-- ============================================================
