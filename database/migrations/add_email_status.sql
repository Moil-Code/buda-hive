-- Add email tracking columns to licenses table
-- Run this in Supabase SQL Editor

-- Add message_id column to store Resend email ID
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS message_id TEXT;

-- Create index for message_id queries
CREATE INDEX IF NOT EXISTS idx_licenses_message_id ON public.licenses(message_id);

-- Comment on columns
COMMENT ON COLUMN public.licenses.message_id IS 'Resend email ID for tracking email delivery status';

SELECT 'Email tracking columns added successfully!' as status;
