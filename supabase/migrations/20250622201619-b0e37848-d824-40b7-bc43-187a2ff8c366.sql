
-- Add columns to employment_contracts table to support account creation
ALTER TABLE public.employment_contracts 
ADD COLUMN account_created BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN account_password TEXT NULL,
ADD COLUMN account_created_at TIMESTAMP WITH TIME ZONE NULL;

-- Update the status check to include the new 'abgelehnt' status
-- (The existing status values are 'pending', 'accepted', 'rejected' - we'll map 'abgelehnt' to 'rejected' and 'angenommen' to 'accepted')
