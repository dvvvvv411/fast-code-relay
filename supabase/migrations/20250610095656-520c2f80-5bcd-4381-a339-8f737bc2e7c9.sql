
-- Create a table for employee activity logs
CREATE TABLE public.employee_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL, -- 'assignment_sent', 'evaluation_submitted', etc.
  employee_first_name TEXT NOT NULL,
  employee_last_name TEXT NOT NULL,
  assignment_id UUID REFERENCES auftrag_assignments(id),
  evaluation_id UUID REFERENCES evaluations(id),
  details JSONB, -- Additional details like auftrag title, rating, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for better performance when querying by employee and date
CREATE INDEX idx_employee_activity_logs_employee ON public.employee_activity_logs (employee_first_name, employee_last_name);
CREATE INDEX idx_employee_activity_logs_created_at ON public.employee_activity_logs (created_at);

-- Enable Row Level Security
ALTER TABLE public.employee_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (assuming admin role exists)
CREATE POLICY "Admins can view all activity logs" 
  ON public.employee_activity_logs 
  FOR ALL 
  USING (true);

-- Function to log assignment sent activity
CREATE OR REPLACE FUNCTION public.log_assignment_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Get auftrag details
  INSERT INTO public.employee_activity_logs (
    activity_type,
    employee_first_name,
    employee_last_name,
    assignment_id,
    details
  ) 
  SELECT 
    'assignment_sent',
    NEW.worker_first_name,
    NEW.worker_last_name,
    NEW.id,
    jsonb_build_object(
      'auftrag_title', a.title,
      'auftragsnummer', a.auftragsnummer,
      'anbieter', a.anbieter
    )
  FROM auftraege a
  WHERE a.id = NEW.auftrag_id;
  
  RETURN NEW;
END;
$$;

-- Function to log evaluation submitted activity
CREATE OR REPLACE FUNCTION public.log_evaluation_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Get assignment and auftrag details
  INSERT INTO public.employee_activity_logs (
    activity_type,
    employee_first_name,
    employee_last_name,
    assignment_id,
    evaluation_id,
    details
  )
  SELECT 
    'evaluation_submitted',
    aa.worker_first_name,
    aa.worker_last_name,
    NEW.assignment_id,
    NEW.id,
    jsonb_build_object(
      'star_rating', NEW.star_rating,
      'has_text_feedback', CASE WHEN NEW.text_feedback IS NOT NULL AND NEW.text_feedback != '' THEN true ELSE false END,
      'auftrag_title', a.title,
      'auftragsnummer', a.auftragsnummer,
      'question_text', eq.question_text
    )
  FROM auftrag_assignments aa
  JOIN auftraege a ON a.id = aa.auftrag_id
  LEFT JOIN evaluation_questions eq ON eq.id = NEW.question_id
  WHERE aa.id = NEW.assignment_id;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_log_assignment_sent
  AFTER INSERT ON public.auftrag_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assignment_sent();

CREATE TRIGGER trigger_log_evaluation_submitted
  AFTER INSERT ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_evaluation_submitted();
