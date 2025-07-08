
-- Add RLS policy to allow authenticated users to mark SMS as sent
CREATE POLICY "Authenticated users can mark SMS as sent" ON public.requests
FOR UPDATE 
USING (status = 'activated')
WITH CHECK (status = 'sms_sent' AND auth.role() = 'authenticated');
