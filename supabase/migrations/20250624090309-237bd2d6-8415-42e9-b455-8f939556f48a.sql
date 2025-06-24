
-- Add approval workflow columns to the evaluations table
ALTER TABLE public.evaluations 
ADD COLUMN status text NOT NULL DEFAULT 'pending',
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approved_by uuid REFERENCES auth.users(id),
ADD COLUMN rejection_reason text;

-- Create index for better performance when filtering by status
CREATE INDEX idx_evaluations_status ON public.evaluations(status);

-- Update existing evaluations to have 'approved' status (assuming they were previously approved)
UPDATE public.evaluations 
SET status = 'approved' 
WHERE status = 'pending';
