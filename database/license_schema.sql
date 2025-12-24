-- License Management System Schema for Moil/Buda Hive
-- This schema supports admin authentication and license management

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.licenses CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- Create admins table
-- Admins can only sign up with @budaedc.com or @moilapp.com emails
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN email LIKE '%@budaedc.com' THEN 'Buda EDC'
      WHEN email LIKE '%@moilapp.com' THEN 'Moil'
    END
  ) STORED,
  purchased_license_count INTEGER DEFAULT 0 NOT NULL,
  active_purchased_license_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_admin_email CHECK (
    email LIKE '%@budaedc.com' OR email LIKE '%@moilapp.com'
  ),
  CONSTRAINT valid_license_counts CHECK (
    active_purchased_license_count <= purchased_license_count
  )
);

-- Create licenses table
-- Tracks licenses purchased and assigned to users
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  is_activated BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Policies for admins table
-- Admins can view their own profile
CREATE POLICY "Admins can view own profile" ON public.admins
  FOR SELECT USING (auth.uid() = id);

-- Admins can update their own profile
CREATE POLICY "Admins can update own profile" ON public.admins
  FOR UPDATE USING (auth.uid() = id);

-- Note: The purchase endpoint uses service_role key which bypasses RLS

-- Policies for licenses table
-- Allow public read access for license verification (used by mobile app)
-- and allow admins to view their own licenses
CREATE POLICY "Allow license verification and admin access" ON public.licenses
  FOR SELECT USING (
    true  -- Allow public read for verification endpoint
    OR EXISTS (
      SELECT 1 FROM public.admins 
      WHERE id = auth.uid() AND id = licenses.admin_id
    )
  );

-- Admins can insert their own licenses
CREATE POLICY "Admins can insert own licenses" ON public.licenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE id = auth.uid() AND id = licenses.admin_id
    )
  );

-- Admins can update their own licenses
CREATE POLICY "Admins can update own licenses" ON public.licenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE id = auth.uid() AND id = licenses.admin_id
    )
  );

-- Admins can delete their own licenses
CREATE POLICY "Admins can delete own licenses" ON public.licenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE id = auth.uid() AND id = licenses.admin_id
    )
  );

-- Function to handle new admin creation
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create admin record if email is from allowed domains
  IF NEW.email LIKE '%@budaedc.com' OR NEW.email LIKE '%@moilapp.com' THEN
    INSERT INTO public.admins (id, email, first_name, last_name)
    VALUES (
      NEW.id, 
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'User')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new admin creation
DROP TRIGGER IF EXISTS on_auth_admin_created ON auth.users;
CREATE TRIGGER on_auth_admin_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_admins_updated_at ON public.admins;
CREATE TRIGGER handle_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_licenses_updated_at ON public.licenses;
CREATE TRIGGER handle_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to generate activation token
CREATE OR REPLACE FUNCTION public.generate_activation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_licenses_admin_id ON public.licenses(admin_id);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON public.licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_is_activated ON public.licenses(is_activated);

-- Insert sample admin (optional - for testing)
-- UPDATE: You'll need to manually create an admin user through Supabase Auth first
-- Then this record will be automatically created by the trigger
