-- ============================================
-- FINAL RLS FIX - COMPLETE SOLUTION
-- ============================================
-- This completely removes problematic RLS and uses a simpler approach

-- ============================================
-- STEP 1: DISABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- ============================================
-- STEP 3: DROP OLD HELPER FUNCTIONS
-- ============================================
DROP FUNCTION IF EXISTS public.user_teams();
DROP FUNCTION IF EXISTS public.user_is_team_admin(UUID);

-- ============================================
-- STEP 4: RE-ENABLE RLS
-- ============================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE SIMPLE NON-RECURSIVE POLICIES
-- ============================================

-- ============================================
-- ADMINS TABLE - Simple self-access
-- ============================================
CREATE POLICY "admins_select" ON public.admins
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "admins_update" ON public.admins
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ============================================
-- TEAMS TABLE
-- ============================================
-- Anyone authenticated can SELECT teams (filter in app layer)
CREATE POLICY "teams_select" ON public.teams
  FOR SELECT TO authenticated
  USING (true);

-- Owner can INSERT (creating their own team)
CREATE POLICY "teams_insert" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Owner can UPDATE
CREATE POLICY "teams_update" ON public.teams
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- Owner can DELETE
CREATE POLICY "teams_delete" ON public.teams
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ============================================
-- TEAM_MEMBERS TABLE
-- ============================================
-- Anyone authenticated can SELECT (filter in app layer)
CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT TO authenticated
  USING (true);

-- Anyone authenticated can INSERT (validation in app layer)
CREATE POLICY "team_members_insert" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Anyone authenticated can UPDATE (validation in app layer)
CREATE POLICY "team_members_update" ON public.team_members
  FOR UPDATE TO authenticated
  USING (true);

-- Anyone authenticated can DELETE (validation in app layer)
CREATE POLICY "team_members_delete" ON public.team_members
  FOR DELETE TO authenticated
  USING (true);

-- ============================================
-- TEAM_INVITATIONS TABLE
-- ============================================
CREATE POLICY "invitations_select" ON public.team_invitations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "invitations_insert" ON public.team_invitations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "invitations_update" ON public.team_invitations
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "invitations_delete" ON public.team_invitations
  FOR DELETE TO authenticated
  USING (true);

-- ============================================
-- ACTIVITY_LOGS TABLE
-- ============================================
CREATE POLICY "activity_select" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "activity_insert" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================
-- LICENSES TABLE
-- ============================================
-- User can SELECT their own licenses
CREATE POLICY "licenses_select_own" ON public.licenses
  FOR SELECT TO authenticated
  USING (admin_id = auth.uid());

-- User can INSERT their own licenses
CREATE POLICY "licenses_insert_own" ON public.licenses
  FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid());

-- User can UPDATE their own licenses
CREATE POLICY "licenses_update_own" ON public.licenses
  FOR UPDATE TO authenticated
  USING (admin_id = auth.uid());

-- User can DELETE their own licenses
CREATE POLICY "licenses_delete_own" ON public.licenses
  FOR DELETE TO authenticated
  USING (admin_id = auth.uid());

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'RLS policies applied successfully!' as status;

-- Show all policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
