-- Migration: Add license tracking columns
-- Run this in Supabase SQL Editor

-- ============================================
-- Add purchased_license_count to TEAMS table (primary location for license tracking)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teams' 
    AND column_name = 'purchased_license_count'
  ) THEN
    ALTER TABLE public.teams 
    ADD COLUMN purchased_license_count INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- ============================================
-- Add purchased_license_count to ADMINS table (for backward compatibility / solo admins)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admins' 
    AND column_name = 'purchased_license_count'
  ) THEN
    ALTER TABLE public.admins 
    ADD COLUMN purchased_license_count INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- ============================================
-- Verify the columns were added
-- ============================================
SELECT 'teams' as table_name, column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'teams'
AND column_name = 'purchased_license_count'
UNION ALL
SELECT 'admins' as table_name, column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'admins'
AND column_name = 'purchased_license_count';
