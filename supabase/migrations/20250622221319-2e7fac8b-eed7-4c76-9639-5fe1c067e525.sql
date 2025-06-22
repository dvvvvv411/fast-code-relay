
-- Add assigned_user_id column to auftrag_assignments table
ALTER TABLE public.auftrag_assignments 
ADD COLUMN assigned_user_id uuid REFERENCES auth.users(id);

-- Add index for better performance when filtering by assigned user
CREATE INDEX idx_auftrag_assignments_assigned_user ON public.auftrag_assignments(assigned_user_id);

-- Enable RLS on auftrag_assignments table if not already enabled
ALTER TABLE public.auftrag_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own assignments
CREATE POLICY "Users can view their own assignments" 
ON public.auftrag_assignments 
FOR SELECT 
USING (auth.uid() = assigned_user_id);

-- Create policy for admins to view all assignments
CREATE POLICY "Admins can view all assignments" 
ON public.auftrag_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow authenticated users to view basic auftrag information for assignments
CREATE POLICY "Users can view auftraege for their assignments" 
ON public.auftraege 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.auftrag_assignments 
    WHERE auftrag_id = auftraege.id AND assigned_user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Enable RLS on auftraege table if not already enabled
ALTER TABLE public.auftraege ENABLE ROW LEVEL SECURITY;
