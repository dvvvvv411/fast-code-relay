-- Create telegram_chat_ids table for managing Telegram chat IDs
CREATE TABLE public.telegram_chat_ids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_chat_ids ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage telegram chat IDs" 
ON public.telegram_chat_ids 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_telegram_chat_ids_updated_at
BEFORE UPDATE ON public.telegram_chat_ids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();