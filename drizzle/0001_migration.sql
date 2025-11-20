-- Migration: Fix free trial columns
-- This migration safely handles the column rename/creation

-- Drop old column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS has_used_free_trial;

-- Add new columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS nclex_free_trial_used BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS teas_free_trial_used BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hesi_free_trial_used BOOLEAN DEFAULT false NOT NULL;
