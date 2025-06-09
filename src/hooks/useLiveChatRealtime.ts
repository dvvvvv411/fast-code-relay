
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  message: string;
  sender_type: 'user' | 'admin';
  sender_name: string;
  created_at: string;
}

interface LiveChat {
  id: string;
  assignment_id: string | null;
  session_id: string;
  worker_name: string;
  status: string;
  created_at: string;
  closed_at: string | null;
}

interface UseLiveChatRealtimeOptions {
  chatId?: string;
  onNewMessage?: (message: Message) => void;
  onNewChat?: (chat: LiveChat) => void;
  onChatUpdate?: (chat: LiveChat) => void;
}

export const useLiveChatRealtime = ({
  chatId,
  onNewMessage,
  onNewChat,
  onChatUpdate
}: UseLiveChatRealtimeOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('Cleaning up realtime channel:', channelRef.current.topic);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!chatId && !onNewChat && !onChatUpdate) return;

    cleanup(); // Clean up any existing channel

    const channelName = chatId 
      ? `live-chat-${chatId}` 
      : 'live-chats-admin';
    
    console.log('Setting up realtime channel:', channelName);

    const channel = supabase.channel(channelName);

    // Subscribe to message changes for specific chat
    if (chatId && onNewMessage) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          onNewMessage(newMessage);
        }
      );
    }

    // Subscribe to new chats (for admin)
    if (onNewChat) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chats'
        },
        (payload) => {
          console.log('New chat created:', payload);
          const newChat = payload.new as LiveChat;
          onNewChat(newChat);
        }
      );
    }

    // Subscribe to chat updates (for admin)
    if (onChatUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_chats'
        },
        (payload) => {
          console.log('Chat updated:', payload);
          const updatedChat = payload.new as LiveChat;
          onChatUpdate(updatedChat);
        }
      );
    }

    channel.subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });

    channelRef.current = channel;

    return cleanup;
  }, [chatId, onNewMessage, onNewChat, onChatUpdate, cleanup]);

  return { cleanup };
};
