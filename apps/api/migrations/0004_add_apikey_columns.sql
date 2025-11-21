-- Migration: Add missing apikey columns
-- 2025-11-21

ALTER TABLE apikey ADD COLUMN prefix TEXT;
ALTER TABLE apikey ADD COLUMN start TEXT;
ALTER TABLE apikey ADD COLUMN metadata TEXT;
ALTER TABLE apikey ADD COLUMN rate_limit_max INTEGER;
ALTER TABLE apikey ADD COLUMN rate_limit_refill_rate INTEGER;
ALTER TABLE apikey ADD COLUMN rate_limit_refill_interval INTEGER;

-- Also alter permissions to be JSON type (just update the constraint)
-- SQLite doesn't support ALTER COLUMN, so this comment is for documentation
-- The existing column will work as-is
