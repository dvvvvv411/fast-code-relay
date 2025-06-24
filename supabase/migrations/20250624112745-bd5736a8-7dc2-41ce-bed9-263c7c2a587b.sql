
-- Add bank_name column to employment_contracts table
ALTER TABLE public.employment_contracts 
ADD COLUMN bank_name text;

-- Update the useUserBankData hook to include bank_name in the interface
COMMENT ON COLUMN public.employment_contracts.bank_name IS 'Name of the bank for the employment contract';
