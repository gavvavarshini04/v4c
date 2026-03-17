-- Run this in Supabase SQL Editor to enable AI features on the complaints table
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks)

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_department TEXT,
  ADD COLUMN IF NOT EXISTS image_issue_type TEXT;
