
-- Check if employment_contracts table exists, if not create it
CREATE TABLE IF NOT EXISTS public.employment_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  social_security_number TEXT NOT NULL,
  tax_number TEXT NOT NULL,
  health_insurance_name TEXT NOT NULL,
  iban TEXT NOT NULL,
  bic TEXT,
  marital_status TEXT,
  start_date DATE NOT NULL,
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the employment_contracts table
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for employment_contracts (only if table was created)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employment_contracts' 
        AND policyname = 'Allow admin access to employment contracts'
    ) THEN
        CREATE POLICY "Allow admin access to employment contracts" 
          ON public.employment_contracts 
          FOR ALL 
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employment_contracts' 
        AND policyname = 'Allow users to view their own contracts'
    ) THEN
        CREATE POLICY "Allow users to view their own contracts" 
          ON public.employment_contracts 
          FOR SELECT 
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employment_contracts' 
        AND policyname = 'Allow users to update their own contracts'
    ) THEN
        CREATE POLICY "Allow users to update their own contracts" 
          ON public.employment_contracts 
          FOR UPDATE 
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Function to generate secure tokens (create if not exists)
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
