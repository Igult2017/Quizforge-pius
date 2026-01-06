-- Migration: Fix free trial columns
-- This migration safely handles the column rename/creation

-- Drop old column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS has_used_free_trial;

-- Add new columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS nclex_free_trial_used BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS teas_free_trial_used BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hesi_free_trial_used BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_new_signup BOOLEAN DEFAULT true NOT NULL;

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

-- Add generation_job_id column to generation_logs table
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS generation_job_id integer REFERENCES generation_jobs(id);

-- Make subject_progress_id nullable (required for manual generation jobs)
ALTER TABLE generation_logs ALTER COLUMN subject_progress_id DROP NOT NULL;

-- Add areas_to_cover column to generation_jobs
ALTER TABLE generation_jobs ADD COLUMN IF NOT EXISTS areas_to_cover text;

-- Add topic column to questions table for specific topic tracking
ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic text;

-- Create user_topic_performance table for adaptive learning
CREATE TABLE IF NOT EXISTS "user_topic_performance" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" varchar NOT NULL REFERENCES users(id),
    "category" text NOT NULL,
    "subject" text NOT NULL,
    "topic" text,
    "total_attempted" integer DEFAULT 0 NOT NULL,
    "correct_count" integer DEFAULT 0 NOT NULL,
    "accuracy" integer DEFAULT 0 NOT NULL,
    "last_attempted_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
