
-- Create storage bucket for contract PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contract-pdfs', 'contract-pdfs', true);

-- Create RLS policies for the contract-pdfs bucket
CREATE POLICY "Public can view contract PDFs" ON storage.objects
FOR SELECT USING (bucket_id = 'contract-pdfs');

CREATE POLICY "Admins can upload contract PDFs" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'contract-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update contract PDFs" ON storage.objects
FOR UPDATE USING (bucket_id = 'contract-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete contract PDFs" ON storage.objects
FOR DELETE USING (bucket_id = 'contract-pdfs' AND auth.uid() IS NOT NULL);
