-- Add email tracking columns to licenses table
-- Run this in Supabase SQL Editor

-- Add message_id column to store Resend email ID
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS message_id TEXT;

-- Add email_status column to store current email delivery status from Resend
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending';

-- Create index for message_id queries
CREATE INDEX IF NOT EXISTS idx_licenses_message_id ON public.licenses(message_id);

-- Create index for email_status queries
CREATE INDEX IF NOT EXISTS idx_licenses_email_status ON public.licenses(email_status);

-- Comment on columns
COMMENT ON COLUMN public.licenses.message_id IS 'Resend email ID for tracking email delivery status';
COMMENT ON COLUMN public.licenses.email_status IS 'Current email delivery status from Resend: pending, sent, delivered, bounced, failed';

SELECT 'Email tracking columns added successfully!' as status;
