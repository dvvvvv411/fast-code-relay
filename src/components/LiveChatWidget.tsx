
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, User, UserCheck, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  message: string;
  sender_type: 'user' | 'admin';
  sender_name: string;
  created_at: string;
}

interface LiveChatWidgetProps {
  assignmentId?: string;
  workerName: string;
}

const LiveChatWidget = ({ assignmentId, workerName }: LiveChatWidgetProps) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate session ID on mount
  useEffect(() => {
    const generateSessionId = () => {
      return 'chat-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    };
    setSessionId(generateSessionId());
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages for the chat
  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Type cast the data to match our Message interface
      const typedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'user' | 'admin'
      }));
      
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!chatId) return;

    // Initial fetch
    fetchMessages(chatId);

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`live_chat_messages_${chatId}`)
      .on(
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
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const startChat = async () => {
    try {
      // Create a new chat session
      const { data: chatData, error: chatError } = await supabase
        .from('live_chats')
        .insert({
          assignment_id: assignmentId,
          session_id: sessionId,
          worker_name: workerName,
          status: 'active'
        })
        .select()
        .single();

      if (chatError) throw chatError;

      setChatId(chatData.id);
      setIsConnected(true);

      // Send initial message
      await supabase
        .from('live_chat_messages')
        .insert({
          chat_id: chatData.id,
          message: `${workerName} hat den Chat gestartet`,
          sender_type: 'user',
          sender_name: workerName
        });

    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;

    try {
      await supabase
        .from('live_chat_messages')
        .insert({
          chat_id: chatId,
          message: newMessage,
          sender_type: 'user',
          sender_name: workerName
        });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isMinimized) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              Live Chat
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Verbunden
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            Live Chat
            {isConnected && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Verbunden
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-6">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Benötigen Sie Hilfe? Starten Sie einen Live-Chat mit unserem Support-Team.
            </p>
            <Button 
              onClick={startChat}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Chat starten
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-64 w-full border rounded-lg p-3">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${
                      message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender_type === 'admin' && (
                      <UserCheck className="h-6 w-6 text-blue-500 mt-1" />
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender_type === 'user'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_type === 'user'
                            ? 'text-orange-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.sender_type === 'user' && (
                      <User className="h-6 w-6 text-orange-500 mt-1" />
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Nachricht eingeben..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                size="sm"
                disabled={!newMessage.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                💡 <strong>Tipp:</strong> Unser Support-Team antwortet normalerweise 
                innerhalb weniger Minuten während der Geschäftszeiten.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveChatWidget;
