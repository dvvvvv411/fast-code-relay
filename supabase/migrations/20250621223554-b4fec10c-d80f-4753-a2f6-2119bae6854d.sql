
-- Create table for employment contract information
CREATE TABLE public.employment_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  start_date DATE NOT NULL,
  social_security_number TEXT NOT NULL,
  tax_number TEXT NOT NULL,
  health_insurance_name TEXT NOT NULL,
  health_insurance_number TEXT NOT NULL,
  iban TEXT NOT NULL,
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;

-- Allow public access for contract submission (applicants don't have auth)
CREATE POLICY "Allow public insert for employment contracts"
  ON public.employment_contracts
  FOR INSERT
  WITH CHECK (true);

-- Allow public read for contract submission page
CREATE POLICY "Allow public read for employment contracts"
  ON public.employment_contracts
  FOR SELECT
  USING (true);

-- Create table for contract request tokens
CREATE TABLE public.contract_request_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Add RLS policies for tokens
ALTER TABLE public.contract_request_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public read for token validation
CREATE POLICY "Allow public read for contract tokens"
  ON public.contract_request_tokens
  FOR SELECT
  USING (true);

-- Create index for token lookup
CREATE INDEX idx_contract_request_tokens_token ON public.contract_request_tokens(token);
