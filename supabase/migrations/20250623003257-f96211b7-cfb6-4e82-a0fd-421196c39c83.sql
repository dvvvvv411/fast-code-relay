
-- Add status column to auftrag_assignments table to track evaluation workflow
ALTER TABLE public.auftrag_assignments 
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Add evaluation_approved_at timestamp for tracking when evaluations are approved
ALTER TABLE public.auftrag_assignments 
ADD COLUMN evaluation_approved_at timestamp with time zone;

-- Add evaluation_approved_by to track which admin approved the evaluation
ALTER TABLE public.auftrag_assignments 
ADD COLUMN evaluation_approved_by uuid REFERENCES auth.users(id);

-- Update existing completed assignments to have 'completed' status
UPDATE public.auftrag_assignments 
SET status = 'completed' 
WHERE is_completed = true;

-- Update assignments that are evaluated but not completed to 'under_review' status
UPDATE public.auftrag_assignments 
SET status = 'under_review' 
WHERE is_evaluated = true AND is_completed = false;

-- Create index for better performance when filtering by status
CREATE INDEX idx_auftrag_assignments_status ON public.auftrag_assignments(status);

-- Create index for filtering assignments with user profiles
CREATE INDEX idx_auftrag_assignments_user_id ON public.auftrag_assignments(assigned_user_id) WHERE assigned_user_id IS NOT NULL;
