
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert for employment contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Allow admin access to employment contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Allow admin access to contract tokens" ON public.contract_request_tokens;
DROP POLICY IF EXISTS "Allow public read for contract tokens" ON public.contract_request_tokens;

-- Add foreign key constraints only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employment_contracts_appointment_id_fkey'
    ) THEN
        ALTER TABLE public.employment_contracts 
        ADD CONSTRAINT employment_contracts_appointment_id_fkey 
        FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contract_request_tokens_appointment_id_fkey'
    ) THEN
        ALTER TABLE public.contract_request_tokens 
        ADD CONSTRAINT contract_request_tokens_appointment_id_fkey 
        FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);
    END IF;
END $$;

-- Create RLS policies for employment_contracts
CREATE POLICY "Allow public insert for employment contracts" 
  ON public.employment_contracts 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow admin access to employment contracts" 
  ON public.employment_contracts 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create RLS policies for contract_request_tokens
CREATE POLICY "Allow admin access to contract tokens" 
  ON public.contract_request_tokens 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Allow public read for contract tokens" 
  ON public.contract_request_tokens 
  FOR SELECT 
  USING (true);
