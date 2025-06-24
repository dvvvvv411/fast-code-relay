
-- Enable RLS on user_bonuses table if not already enabled
ALTER TABLE public.user_bonuses ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to view their own bonuses
CREATE POLICY "Users can view their own bonuses" 
  ON public.user_bonuses 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create RLS policy for admins to view all bonuses
CREATE POLICY "Admins can view all bonuses" 
  ON public.user_bonuses 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
