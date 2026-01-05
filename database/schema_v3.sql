-- ============================================
-- BUDA HIVE DATABASE SCHEMA v3
-- ============================================
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: CREATE ENUM TYPES
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_role') THEN
    CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
    CREATE TYPE activity_type AS ENUM (
      'license_added',
      'license_removed',
      'license_activated',
      'license_resend',
      'licenses_imported',
      'licenses_purchased',
      'member_invited',
      'member_joined',
      'member_removed',
      'member_role_changed',
      'team_settings_updated'
    );
  END IF;
END $$;

-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================

-- Admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  purchased_license_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_admin_email CHECK (
    email LIKE '%@budaedc.com' OR email LIKE '%@moilapp.com'
  )
);

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('budaedc.com', 'moilapp.com')),
  purchased_license_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign key separately to avoid circular dependency issues
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'teams_owner_id_fkey' AND table_name = 'teams'
  ) THEN
    ALTER TABLE public.teams ADD CONSTRAINT teams_owner_id_fkey 
      FOREIGN KEY (owner_id) REFERENCES public.admins(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_owner' AND table_name = 'teams'
  ) THEN
    ALTER TABLE public.teams ADD CONSTRAINT unique_owner UNIQUE (owner_id);
  END IF;
END $$;

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  role team_role DEFAULT 'member' NOT NULL,
  invited_by UUID,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign keys separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_members_team_id_fkey' AND table_name = 'team_members'
  ) THEN
    ALTER TABLE public.team_members ADD CONSTRAINT team_members_team_id_fkey 
      FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_members_admin_id_fkey' AND table_name = 'team_members'
  ) THEN
    ALTER TABLE public.team_members ADD CONSTRAINT team_members_admin_id_fkey 
      FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_members_invited_by_fkey' AND table_name = 'team_members'
  ) THEN
    ALTER TABLE public.team_members ADD CONSTRAINT team_members_invited_by_fkey 
      FOREIGN KEY (invited_by) REFERENCES public.admins(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_team_member' AND table_name = 'team_members'
  ) THEN
    ALTER TABLE public.team_members ADD CONSTRAINT unique_team_member UNIQUE (team_id, admin_id);
  END IF;
END $$;

-- Team invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  role team_role DEFAULT 'member' NOT NULL,
  status invitation_status DEFAULT 'pending' NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_invitation_email CHECK (
    email LIKE '%@budaedc.com' OR email LIKE '%@moilapp.com'
  )
);

-- Add foreign keys separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_invitations_team_id_fkey' AND table_name = 'team_invitations'
  ) THEN
    ALTER TABLE public.team_invitations ADD CONSTRAINT team_invitations_team_id_fkey 
      FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_invitations_invited_by_fkey' AND table_name = 'team_invitations'
  ) THEN
    ALTER TABLE public.team_invitations ADD CONSTRAINT team_invitations_invited_by_fkey 
      FOREIGN KEY (invited_by) REFERENCES public.admins(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  admin_id UUID,
  activity_type activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign keys separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_logs_team_id_fkey' AND table_name = 'activity_logs'
  ) THEN
    ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_team_id_fkey 
      FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_logs_admin_id_fkey' AND table_name = 'activity_logs'
  ) THEN
    ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_admin_id_fkey 
      FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  team_id UUID,
  performed_by UUID,
  email TEXT NOT NULL,
  business_name TEXT DEFAULT '',
  business_type TEXT DEFAULT '',
  is_activated BOOLEAN DEFAULT FALSE NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign keys separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'licenses_admin_id_fkey' AND table_name = 'licenses'
  ) THEN
    ALTER TABLE public.licenses ADD CONSTRAINT licenses_admin_id_fkey 
      FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'licenses_team_id_fkey' AND table_name = 'licenses'
  ) THEN
    ALTER TABLE public.licenses ADD CONSTRAINT licenses_team_id_fkey 
      FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'licenses_performed_by_fkey' AND table_name = 'licenses'
  ) THEN
    ALTER TABLE public.licenses ADD CONSTRAINT licenses_performed_by_fkey 
      FOREIGN KEY (performed_by) REFERENCES public.admins(id) ON DELETE SET NULL;
  END IF;
  
  -- Note: unique_license_per_admin is deprecated, use unique_license_per_team instead
  -- This ensures the same email can't have multiple licenses within the same team
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_license_per_team' AND table_name = 'licenses'
  ) THEN
    ALTER TABLE public.licenses ADD CONSTRAINT unique_license_per_team UNIQUE (team_id, email);
  END IF;
END $$;

-- ============================================
-- STEP 3: CREATE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new admin registration
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email LIKE '%@budaedc.com' OR NEW.email LIKE '%@moilapp.com' THEN
    INSERT INTO public.admins (id, email, first_name, last_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
  p_team_id UUID,
  p_admin_id UUID,
  p_activity_type activity_type,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activity_logs (
    team_id,
    admin_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    p_team_id,
    p_admin_id,
    p_activity_type,
    p_description,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a team for an admin
CREATE OR REPLACE FUNCTION public.create_team_for_admin(admin_user_id UUID)
RETURNS UUID AS $$
DECLARE
    admin_record RECORD;
    new_team_id UUID;
    domain_name TEXT;
    team_name TEXT;
BEGIN
    SELECT id, email, first_name, last_name INTO admin_record
    FROM public.admins WHERE id = admin_user_id;
    
    IF admin_record IS NULL THEN
        RAISE EXCEPTION 'Admin not found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.team_members WHERE admin_id = admin_user_id) THEN
        RAISE EXCEPTION 'Admin is already in a team';
    END IF;
    
    domain_name := split_part(admin_record.email, '@', 2);
    
    IF domain_name = 'budaedc.com' THEN
        team_name := admin_record.first_name || '''s Buda EDC Team';
    ELSIF domain_name = 'moilapp.com' THEN
        team_name := admin_record.first_name || '''s Moil Team';
    ELSE
        team_name := admin_record.first_name || '''s Team';
    END IF;
    
    INSERT INTO public.teams (name, domain, owner_id)
    VALUES (team_name, domain_name, admin_record.id)
    RETURNING id INTO new_team_id;
    
    INSERT INTO public.team_members (team_id, admin_id, role)
    VALUES (new_team_id, admin_record.id, 'owner');
    
    UPDATE public.licenses
    SET team_id = new_team_id, performed_by = admin_record.id
    WHERE admin_id = admin_record.id AND team_id IS NULL;
    
    RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: DROP ALL EXISTING POLICIES FIRST
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
-- STEP 6: CREATE SIMPLE NON-RECURSIVE RLS POLICIES
-- ============================================
-- These policies avoid infinite recursion by using simple conditions
-- Complex authorization is handled in the application layer

-- ADMINS TABLE - Simple self-access
CREATE POLICY "admins_select" ON public.admins
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "admins_update" ON public.admins
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- TEAMS TABLE
CREATE POLICY "teams_select" ON public.teams
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "teams_insert" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "teams_update" ON public.teams
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "teams_delete" ON public.teams
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- TEAM_MEMBERS TABLE
CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "team_members_insert" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "team_members_update" ON public.team_members
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "team_members_delete" ON public.team_members
  FOR DELETE TO authenticated
  USING (true);

-- TEAM_INVITATIONS TABLE
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

-- ACTIVITY_LOGS TABLE
CREATE POLICY "activity_select" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "activity_insert" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- LICENSES TABLE - Team members can access all team licenses
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
-- STEP 7: CREATE TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin();

DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON public.team_invitations;
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_licenses_updated_at ON public.licenses;
CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STEP 8: CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_domain ON public.teams(domain);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_admin_id ON public.team_members(admin_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_team_id ON public.activity_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON public.activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_licenses_admin_id ON public.licenses(admin_id);
CREATE INDEX IF NOT EXISTS idx_licenses_team_id ON public.licenses(team_id);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON public.licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_is_activated ON public.licenses(is_activated);

-- ============================================
-- DONE
-- ============================================
SELECT 'Schema created successfully!' as status;
