-- Migration: Update admins RLS policy to allow team members to see each other
-- Run this in Supabase SQL Editor

-- ============================================
-- Drop old admin-only RLS policy
-- ============================================
DROP POLICY IF EXISTS "admins_select" ON public.admins;

-- ============================================
-- Create new team-aware RLS policy for admins
-- ============================================

-- SELECT: Team members can see each other's admin info
CREATE POLICY "admins_select" ON public.admins
  FOR SELECT TO authenticated
  USING (
    -- User can see their own info
    id = auth.uid()
    OR
    -- User can see info of admins in their team
    id IN (
      SELECT tm.admin_id 
      FROM public.team_members tm
      WHERE tm.team_id IN (
        SELECT team_id FROM public.team_members WHERE admin_id = auth.uid()
      )
    )
  );

-- ============================================
-- Verify the policy was created
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'admins' AND schemaname = 'public';
