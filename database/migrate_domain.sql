-- Migration script to update domain from budahive.com to budaedc.com
-- Run this script after updating the schema

-- Update existing admin emails
UPDATE public.admins 
SET email = REPLACE(email, '@budahive.com', '@budaedc.com')
WHERE email LIKE '%@budahive.com';

-- Update any existing auth.users records (if needed)
-- Note: This requires superuser privileges and should be done carefully
-- UPDATE auth.users 
-- SET email = REPLACE(email, '@budahive.com', '@budaedc.com')
-- WHERE email LIKE '%@budahive.com';

-- Verify the changes
SELECT 
  id, 
  email, 
  company_name,
  created_at
FROM public.admins 
WHERE email LIKE '%@budaedc.com' OR email LIKE '%@budahive.com';

-- Show count of updated records
SELECT 
  CASE 
    WHEN email LIKE '%@budaedc.com' THEN 'budaedc.com'
    WHEN email LIKE '%@budahive.com' THEN 'budahive.com (old)'
    WHEN email LIKE '%@moilapp.com' THEN 'moilapp.com'
    ELSE 'other'
  END as domain,
  COUNT(*) as admin_count
FROM public.admins 
GROUP BY 
  CASE 
    WHEN email LIKE '%@budaedc.com' THEN 'budaedc.com'
    WHEN email LIKE '%@budahive.com' THEN 'budahive.com (old)'
    WHEN email LIKE '%@moilapp.com' THEN 'moilapp.com'
    ELSE 'other'
  END;
