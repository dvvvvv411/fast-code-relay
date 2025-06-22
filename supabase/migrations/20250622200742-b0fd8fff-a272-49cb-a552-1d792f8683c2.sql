
-- Create a storage bucket for ID card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-cards', 'id-cards', true);

-- Create policy to allow public access to read files
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'id-cards');

-- Create policy to allow uploads
CREATE POLICY "Allow uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'id-cards');

-- Create policy to allow updates
CREATE POLICY "Allow updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'id-cards');

-- Create policy to allow deletes
CREATE POLICY "Allow deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'id-cards');
