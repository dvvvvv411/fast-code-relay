
-- Remove the health_insurance_number column since we replaced it with marital_status
ALTER TABLE public.employment_contracts DROP COLUMN health_insurance_number;

-- Add the marital_status column
ALTER TABLE public.employment_contracts ADD COLUMN marital_status TEXT;
