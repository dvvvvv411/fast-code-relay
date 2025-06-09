
-- Create live_chats table for chat sessions
CREATE TABLE public.live_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.auftrag_assignments(id),
  session_id TEXT NOT NULL UNIQUE,
  worker_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create live_chat_messages table for chat messages
CREATE TABLE public.live_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.live_chats(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_live_chats_session_id ON public.live_chats(session_id);
CREATE INDEX idx_live_chats_assignment_id ON public.live_chats(assignment_id);
CREATE INDEX idx_live_chat_messages_chat_id ON public.live_chat_messages(chat_id);
CREATE INDEX idx_live_chat_messages_created_at ON public.live_chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.live_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for live_chats (public access for now since we don't have user auth on assignment pages)
CREATE POLICY "Anyone can view live chats" ON public.live_chats FOR SELECT USING (true);
CREATE POLICY "Anyone can create live chats" ON public.live_chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update live chats" ON public.live_chats FOR UPDATE USING (true);

-- RLS policies for live_chat_messages (public access for now)
CREATE POLICY "Anyone can view live chat messages" ON public.live_chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create live chat messages" ON public.live_chat_messages FOR INSERT WITH CHECK (true);
