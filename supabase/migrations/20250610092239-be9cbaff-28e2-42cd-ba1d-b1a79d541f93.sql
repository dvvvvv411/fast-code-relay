
-- Add departed status to auftrag_assignments table
ALTER TABLE public.auftrag_assignments 
ADD COLUMN is_departed boolean DEFAULT false;

-- Add index for better performance when filtering
CREATE INDEX idx_auftrag_assignments_departed ON public.auftrag_assignments(is_departed);
