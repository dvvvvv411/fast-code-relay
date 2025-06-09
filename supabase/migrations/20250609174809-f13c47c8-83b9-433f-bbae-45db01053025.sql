
-- Enable realtime for live chat tables
ALTER TABLE public.live_chats REPLICA IDENTITY FULL;
ALTER TABLE public.live_chat_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
