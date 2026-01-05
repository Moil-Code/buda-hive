-- Migration: Add license tracking columns and update constraints for team collaboration
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
-- Update unique constraint from admin-level to team-level
-- This allows team collaboration where any team member can add licenses
-- ============================================
DO $$
BEGIN
  -- Drop the old admin-level constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_license_per_admin' AND table_name = 'licenses'
  ) THEN
    ALTER TABLE public.licenses DROP CONSTRAINT unique_license_per_admin;
  END IF;
  
  -- Add the new team-level constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_license_per_team' AND table_name = 'licenses'
  ) THEN
    ALTER TABLE public.licenses ADD CONSTRAINT unique_license_per_team UNIQUE (team_id, email);
  END IF;
END $$;

-- ============================================
-- Verify the changes
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

-- Show constraints on licenses table
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'licenses' AND table_schema = 'public';
