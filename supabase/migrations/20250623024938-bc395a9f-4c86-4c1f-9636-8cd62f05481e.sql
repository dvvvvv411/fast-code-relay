
-- Add RLS policy to allow users to update their own assignments
-- This will enable registered users to update the is_evaluated and status fields
CREATE POLICY "Users can update their own assignments" 
  ON public.auftrag_assignments 
  FOR UPDATE 
  USING (auth.uid() = assigned_user_id)
  WITH CHECK (auth.uid() = assigned_user_id);

-- Enable RLS on the table if not already enabled
ALTER TABLE public.auftrag_assignments ENABLE ROW LEVEL SECURITY;
