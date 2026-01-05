-- Migration: Update licenses RLS policies to allow team collaboration
-- Run this in Supabase SQL Editor

-- ============================================
-- Drop old admin-only RLS policies
-- ============================================
DROP POLICY IF EXISTS "licenses_select_own" ON public.licenses;
DROP POLICY IF EXISTS "licenses_insert_own" ON public.licenses;
DROP POLICY IF EXISTS "licenses_update_own" ON public.licenses;
DROP POLICY IF EXISTS "licenses_delete_own" ON public.licenses;

-- ============================================
-- Create new team-aware RLS policies
-- ============================================

-- SELECT: Team members can see all team licenses
CREATE POLICY "licenses_select_team" ON public.licenses
  FOR SELECT TO authenticated
  USING (
    -- User can see their own licenses
    admin_id = auth.uid()
    OR
    -- User can see licenses in their team
    team_id IN (
      SELECT team_id FROM public.team_members WHERE admin_id = auth.uid()
    )
  );

-- INSERT: Team members can add licenses to their team
CREATE POLICY "licenses_insert_team" ON public.licenses
  FOR INSERT TO authenticated
  WITH CHECK (
    -- User can insert licenses as themselves
    admin_id = auth.uid()
    AND
    -- If team_id is set, user must be in that team
    (team_id IS NULL OR team_id IN (
      SELECT team_id FROM public.team_members WHERE admin_id = auth.uid()
    ))
  );

-- UPDATE: Team members can update all team licenses
CREATE POLICY "licenses_update_team" ON public.licenses
  FOR UPDATE TO authenticated
  USING (
    -- User can update their own licenses
    admin_id = auth.uid()
    OR
    -- User can update licenses in their team
    team_id IN (
      SELECT team_id FROM public.team_members WHERE admin_id = auth.uid()
    )
  );

-- DELETE: Team members can delete all team licenses
CREATE POLICY "licenses_delete_team" ON public.licenses
  FOR DELETE TO authenticated
  USING (
    -- User can delete their own licenses
    admin_id = auth.uid()
    OR
    -- User can delete licenses in their team
    team_id IN (
      SELECT team_id FROM public.team_members WHERE admin_id = auth.uid()
    )
  );

-- ============================================
-- Verify the policies were created
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'licenses' AND schemaname = 'public';
