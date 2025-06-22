
-- Create storage bucket for employment documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employment-documents', 'employment-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage bucket
CREATE POLICY "Authenticated users can upload employment documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'employment-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view employment documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'employment-documents'
  AND auth.role() = 'authenticated'
);

-- Update RLS policies for employment_contracts to allow public token-based submission
DROP POLICY IF EXISTS "Public can submit employment contracts with valid token" ON public.employment_contracts;

-- Create a more permissive policy for public token-based submissions
CREATE POLICY "Public can submit employment contracts with valid token"
ON public.employment_contracts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contract_request_tokens 
    WHERE appointment_id = employment_contracts.appointment_id 
    AND expires_at > now()
    AND email_sent = true
  )
);

-- Allow public to validate tokens
CREATE POLICY "Public can read contract tokens for validation"
ON public.contract_request_tokens
FOR SELECT
USING (expires_at > now());
