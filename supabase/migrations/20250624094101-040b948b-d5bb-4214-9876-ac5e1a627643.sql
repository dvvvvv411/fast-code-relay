
-- Create a trigger function to automatically set is_completed when status changes to 'completed'
CREATE OR REPLACE FUNCTION public.sync_assignment_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Set is_completed to true when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.is_completed = true;
    -- Set is_completed to false when status changes away from 'completed'
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.is_completed = false;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create the trigger on auftrag_assignments table
DROP TRIGGER IF EXISTS sync_assignment_completion_trigger ON public.auftrag_assignments;
CREATE TRIGGER sync_assignment_completion_trigger
    BEFORE UPDATE ON public.auftrag_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_assignment_completion();
