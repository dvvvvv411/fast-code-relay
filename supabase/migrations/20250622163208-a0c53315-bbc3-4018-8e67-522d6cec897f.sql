
-- Create employment contracts table
CREATE TABLE IF NOT EXISTS public.employment_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  start_date DATE NOT NULL,
  social_security_number TEXT NOT NULL,
  tax_number TEXT NOT NULL,
  health_insurance_name TEXT NOT NULL,
  iban TEXT NOT NULL,
  bic TEXT NULL,
  marital_status TEXT NULL,
  id_card_front_url TEXT NULL,
  id_card_back_url TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contract request tokens table for secure links
CREATE TABLE IF NOT EXISTS public.contract_request_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Add RLS policies for employment contracts
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;

-- Policy for public access (needed for contract form submission)
CREATE POLICY "Public can insert employment contracts" 
  ON public.employment_contracts 
  FOR INSERT 
  WITH CHECK (true);

-- Policy for admins to view all contracts
CREATE POLICY "Admins can view all employment contracts" 
  ON public.employment_contracts 
  FOR SELECT 
  USING (true);

-- Policy for admins to update contracts
CREATE POLICY "Admins can update employment contracts" 
  ON public.employment_contracts 
  FOR UPDATE 
  USING (true);

-- Add RLS policies for contract request tokens
ALTER TABLE public.contract_request_tokens ENABLE ROW LEVEL SECURITY;

-- Policy for public access to tokens (needed for form access)
CREATE POLICY "Public can view valid tokens" 
  ON public.contract_request_tokens 
  FOR SELECT 
  USING (expires_at > now());

-- Policy for admins to manage tokens
CREATE POLICY "Admins can manage tokens" 
  ON public.contract_request_tokens 
  FOR ALL 
  USING (true);

-- Create function to generate secure tokens
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    token TEXT;
BEGIN
    -- Generate a random token using encode and gen_random_bytes
    token := encode(gen_random_bytes(32), 'base64');
    -- Remove characters that might cause issues in URLs
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
    RETURN token;
END;
$$;
