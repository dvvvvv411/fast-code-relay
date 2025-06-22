
-- Add a new table for employment contract data
CREATE TABLE IF NOT EXISTS public.employment_contracts (
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

-- Create a table for contract request tokens
CREATE TABLE IF NOT EXISTS public.contract_request_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_request_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for employment_contracts (admin access only)
CREATE POLICY "Admin can view all employment contracts"
  ON public.employment_contracts
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can insert employment contracts"
  ON public.employment_contracts
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Create policies for contract_request_tokens (admin access only)
CREATE POLICY "Admin can view all contract tokens"
  ON public.contract_request_tokens
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can insert contract tokens"
  ON public.contract_request_tokens
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow public access for the contract form submission (token-based)
CREATE POLICY "Public can submit employment contracts with valid token"
  ON public.employment_contracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contract_request_tokens 
      WHERE appointment_id = employment_contracts.appointment_id 
      AND expires_at > now()
    )
  );
