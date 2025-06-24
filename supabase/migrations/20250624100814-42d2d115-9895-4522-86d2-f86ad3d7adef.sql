
-- Add bonus_amount column to auftraege table
ALTER TABLE public.auftraege 
ADD COLUMN bonus_amount decimal(10,2) DEFAULT 0.00;

-- Create user_bonuses table to track bonus payments
CREATE TABLE public.user_bonuses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assignment_id uuid REFERENCES public.auftrag_assignments(id) ON DELETE CASCADE NOT NULL,
  bonus_amount decimal(10,2) NOT NULL,
  awarded_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(assignment_id) -- Ensure one bonus per assignment
);

-- Enable RLS on user_bonuses
ALTER TABLE public.user_bonuses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_bonuses
CREATE POLICY "Users can view their own bonuses" 
  ON public.user_bonuses 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for admins to manage all bonuses
CREATE POLICY "Admins can manage all bonuses" 
  ON public.user_bonuses 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger function to automatically award bonus when assignment is completed and evaluated
CREATE OR REPLACE FUNCTION public.award_bonus_on_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  bonus_amount_value decimal(10,2);
BEGIN
  -- Only proceed if status changed to 'completed' and assignment is evaluated
  IF NEW.status = 'completed' AND NEW.is_evaluated = true AND NEW.assigned_user_id IS NOT NULL 
     AND (OLD.status IS NULL OR OLD.status != 'completed' OR OLD.is_evaluated = false) THEN
    
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
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS award_bonus_trigger ON public.auftrag_assignments;
CREATE TRIGGER award_bonus_trigger
    AFTER UPDATE ON public.auftrag_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.award_bonus_on_completion();
