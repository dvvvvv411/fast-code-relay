-- Add optional login name field to auftrag_assignments table
ALTER TABLE public.auftrag_assignments 
ADD COLUMN anmeldename text NULL;