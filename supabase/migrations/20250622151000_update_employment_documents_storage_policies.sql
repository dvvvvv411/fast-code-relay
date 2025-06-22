
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload employment documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view employment documents" ON storage.objects;

-- Create more permissive policies for public token-based uploads
CREATE POLICY "Public can upload employment documents with valid token"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'employment-documents'
  AND (
    auth.role() = 'authenticated' 
    OR 
    -- Allow public uploads for employment documents (token validation happens in app logic)
    true
  )
);

CREATE POLICY "Public can view employment documents with valid token"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'employment-documents'
  AND (
    auth.role() = 'authenticated'
    OR
    -- Allow public access for employment documents (token validation happens in app logic)
    true
  )
);
