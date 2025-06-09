
-- Add unread_count column to live_chats table
ALTER TABLE public.live_chats 
ADD COLUMN unread_count INTEGER NOT NULL DEFAULT 0;

-- Create function to increment unread count when a new message is added
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment for user messages (not admin messages)
  IF NEW.sender_type = 'user' THEN
    UPDATE public.live_chats 
    SET unread_count = unread_count + 1 
    WHERE id = NEW.chat_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset unread count when admin views/responds to chat
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset unread count when admin sends a message
  IF NEW.sender_type = 'admin' THEN
    UPDATE public.live_chats 
    SET unread_count = 0 
    WHERE id = NEW.chat_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment unread count on new messages
CREATE TRIGGER trigger_increment_unread_count
  AFTER INSERT ON public.live_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- Create trigger to reset unread count when admin responds
CREATE TRIGGER trigger_reset_unread_count
  AFTER INSERT ON public.live_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION reset_unread_count();
