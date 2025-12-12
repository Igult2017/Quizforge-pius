-- Migration: Fix free trial columns
-- This migration safely handles the column rename/creation

-- Drop old column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS has_used_free_trial;

-- Add new columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS nclex_free_trial_used BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS teas_free_trial_used BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hesi_free_trial_used BOOLEAN DEFAULT false NOT NULL;

-- Create generation_jobs table for batch question generation
CREATE TABLE IF NOT EXISTS "generation_jobs" (
    "id" serial PRIMARY KEY NOT NULL,
    "category" text NOT NULL,
    "topic" text NOT NULL,
    "difficulty" text NOT NULL,
    "total_count" integer NOT NULL,
    "generated_count" integer DEFAULT 0 NOT NULL,
    "batch_size" integer DEFAULT 5 NOT NULL,
    "sample_question" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "error_count" integer DEFAULT 0 NOT NULL,
    "last_error" text,
    "created_by" varchar,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "completed_at" timestamp
);

-- Add generation_job_id column to generation_logs table (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generation_logs') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'generation_logs' AND column_name = 'generation_job_id') THEN
            ALTER TABLE generation_logs ADD COLUMN generation_job_id integer REFERENCES generation_jobs(id);
        END IF;
    END IF;
END $$;
