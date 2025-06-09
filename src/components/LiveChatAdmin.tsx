
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, User, UserCheck, Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LiveChat {
  id: string;
  assignment_id: string | null;
  session_id: string;
  worker_name: string;
  status: string;
  created_at: string;
  closed_at: string | null;
}

interface Message {
  id: string;
  message: string;
  sender_type: 'user' | 'admin';
  sender_name: string;
  created_at: string;
}

const LiveChatAdmin = () => {
  const [activeChats, setActiveChats] = useState<LiveChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<LiveChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch active chats
  const fetchActiveChats = async () => {
    try {
      const { data, error } = await supabase
        .from('live_chats')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveChats(data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Fetch messages for selected chat
  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message as admin
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await supabase
        .from('live_chat_messages')
        .insert({
          chat_id: selectedChat.id,
          message: newMessage,
          sender_type: 'admin',
          sender_name: 'Support Team'
        });

      setNewMessage('');
      fetchMessages(selectedChat.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Close chat
  const closeChat = async (chatId: string) => {
    try {
      await supabase
        .from('live_chats')
        .update({ 
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', chatId);

      fetchActiveChats();
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error closing chat:', error);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    fetchActiveChats();

    // Subscribe to new chats
    const chatsChannel = supabase
      .channel('live_chats_admin')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chats'
        },
        () => {
          fetchActiveChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatsChannel);
    };
  }, []);

  // Subscribe to messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    fetchMessages(selectedChat.id);

    const messagesChannel = supabase
      .channel(`messages_${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `chat_id=eq.${selectedChat.id}`
        },
        () => {
          fetchMessages(selectedChat.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedChat]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            Aktive Chats ({activeChats.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {activeChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedChat?.id === chat.id
                      ? 'bg-orange-50 border-orange-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{chat.worker_name}</p>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Aktiv
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {new Date(chat.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {activeChats.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Keine aktiven Chats</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {selectedChat ? (
                <>
                  <User className="h-5 w-5 text-orange-500" />
                  Chat mit {selectedChat.worker_name}
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  Chat auswählen
                </>
              )}
            </CardTitle>
            {selectedChat && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => closeChat(selectedChat.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Chat beenden
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedChat ? (
            <div className="space-y-4">
              <ScrollArea className="h-[350px] border rounded-lg p-3">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-2 ${
                        message.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.sender_type === 'user' && (
                        <User className="h-6 w-6 text-orange-500 mt-1" />
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender_type === 'admin'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_type === 'admin'
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {message.sender_name} • {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      {message.sender_type === 'admin' && (
                        <UserCheck className="h-6 w-6 text-blue-500 mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Nachricht als Support-Team senden..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Wählen Sie einen Chat aus der Liste aus</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveChatAdmin;
