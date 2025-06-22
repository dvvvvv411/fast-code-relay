
-- Add new columns to employment_contracts table for tracking acceptance status
ALTER TABLE public.employment_contracts 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add index for better query performance
CREATE INDEX idx_employment_contracts_status ON public.employment_contracts(status);
CREATE INDEX idx_employment_contracts_user_id ON public.employment_contracts(user_id);

-- Add comment to document the status values
COMMENT ON COLUMN public.employment_contracts.status IS 'Status of the contract: pending, accepted, rejected';
