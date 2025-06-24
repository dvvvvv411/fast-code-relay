
-- Update the trigger function to be SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION public.award_bonus_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  bonus_amount_value decimal(10,2);
BEGIN
  -- Create bonus entry when assignment is under_review and evaluated
  IF NEW.status = 'under_review' AND NEW.is_evaluated = true AND NEW.assigned_user_id IS NOT NULL 
     AND (OLD.status IS NULL OR OLD.status != 'under_review' OR OLD.is_evaluated = false) THEN
    
    -- Get the bonus amount for this auftrag
    SELECT a.bonus_amount INTO bonus_amount_value
    FROM public.auftraege a
    WHERE a.id = NEW.auftrag_id;
    
    -- Only create bonus if amount > 0 and no bonus exists yet
    IF bonus_amount_value > 0 THEN
      INSERT INTO public.user_bonuses (
        user_id,
        assignment_id,
        bonus_amount,
        status
      ) VALUES (
        NEW.assigned_user_id,
        NEW.id,
        bonus_amount_value,
        'pending'
      )
      ON CONFLICT (assignment_id) DO NOTHING; -- Prevent duplicate bonuses
    END IF;
  END IF;
  
  -- Update bonus status to 'paid' when assignment status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.assigned_user_id IS NOT NULL THEN
    UPDATE public.user_bonuses 
    SET status = 'paid'
    WHERE assignment_id = NEW.id AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$function$;
