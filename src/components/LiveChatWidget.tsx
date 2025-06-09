
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, User, UserCheck, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLiveChatRealtime } from '@/hooks/useLiveChatRealtime';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  message: string;
  sender_type: 'user' | 'admin';
  sender_name: string;
  created_at: string;
  isOptimistic?: boolean;
}

interface LiveChatWidgetProps {
  assignmentId?: string;
  workerName: string;
}

const LiveChatWidget = ({ assignmentId, workerName }: LiveChatWidgetProps) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate session ID on mount
  useEffect(() => {
    const generateSessionId = () => {
      return 'chat-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    };
    setSessionId(generateSessionId());
  }, []);

  // Check for existing chat when component mounts
  useEffect(() => {
    if (assignmentId) {
      checkForExistingChat();
    }
  }, [assignmentId]);

  const checkForExistingChat = async () => {
    if (!assignmentId) return;

    try {
      setIsLoading(true);
      console.log('Checking for existing chat for assignment:', assignmentId);

      const { data: existingChat, error } = await supabase
        .from('live_chats')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking for existing chat:', error);
        return;
      }

      if (existingChat) {
        console.log('Found existing chat:', existingChat);
        setChatId(existingChat.id);
        setIsConnected(true);
        // Messages will be fetched when chatId is set
      } else {
        console.log('No existing chat found for assignment:', assignmentId);
      }
    } catch (error) {
      console.error('Error in checkForExistingChat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new messages from realtime
  const handleNewMessage = (newMessage: Message) => {
    setMessages(prev => {
      // Remove any optimistic message that matches this real message
      const filteredMessages = prev.filter(msg => {
        if (msg.isOptimistic && 
            msg.message.trim() === newMessage.message.trim() && 
            msg.sender_type === newMessage.sender_type &&
            msg.sender_name === newMessage.sender_name) {
          return false; // Remove optimistic message
        }
        return true;
      });
      
      // Check if this real message already exists to avoid duplicates
      const messageExists = filteredMessages.some(msg => msg.id === newMessage.id);
      if (messageExists) return prev;
      
      return [...filteredMessages, newMessage];
    });
  };

  // Handle chat updates from realtime
  const handleChatUpdate = (updatedChat: any) => {
    if (chatId === updatedChat.id && updatedChat.status === 'closed') {
      setIsChatClosed(true);
      setIsConnected(false);
      toast({
        title: "Chat beendet",
        description: "Der Chat wurde vom Support-Team beendet.",
      });
    }
  };

  // Set up real-time subscription
  useLiveChatRealtime({
    chatId: chatId || undefined,
    onNewMessage: handleNewMessage,
    onChatUpdate: handleChatUpdate
  });

  // Fetch messages for the chat
  const fetchMessages = async (chatId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const typedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'user' | 'admin'
      }));
      
      setMessages(typedMessages);
      console.log('Loaded messages:', typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Fehler",
        description: "Nachrichten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startChat = async () => {
    try {
      setIsLoading(true);
      console.log('Starting new chat for assignment:', assignmentId);
      
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

      console.log('Created new chat:', chatData);
      setChatId(chatData.id);
      setIsConnected(true);

      // Send initial welcome message as admin/support
      await supabase
        .from('live_chat_messages')
        .insert({
          chat_id: chatData.id,
          message: 'Willkommen im Live Chat, wenn Sie Probleme bei der Aufgabe haben können Sie hier während den Geschäftszeiten nach Hilfe fragen.',
          sender_type: 'admin',
          sender_name: 'Support-Chat'
        });

      toast({
        title: "Chat gestartet",
        description: "Sie sind jetzt mit dem Support verbunden.",
      });

    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Fehler",
        description: "Chat konnte nicht gestartet werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Add optimistic message immediately with unique ID based on content and timestamp
    const timestamp = Date.now();
    const optimisticMessage: Message = {
      id: `temp-${timestamp}`,
      message: messageText,
      sender_type: 'user',
      sender_name: workerName,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .insert({
          chat_id: chatId,
          message: messageText,
          sender_type: 'user',
          sender_name: workerName
        });

      if (error) throw error;

      // Message was sent successfully, the real message will come via realtime
      // and will automatically remove the optimistic message

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Restore message in input
      setNewMessage(messageText);
      
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht gesendet werden.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-fetch messages when chat becomes available
  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    }
  }, [chatId]);

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
              {isChatClosed && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  Beendet
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
            {isChatClosed && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                Beendet
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
        {isChatClosed ? (
          <div className="text-center py-6">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Der Chat wurde erfolgreich beendet. Vielen Dank für Ihre Nachricht!
            </p>
            <p className="text-sm text-gray-500">
              Bei weiteren Fragen können Sie einen neuen Chat starten.
            </p>
          </div>
        ) : !isConnected ? (
          <div className="text-center py-6">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Benötigen Sie Hilfe? Starten Sie einen Live-Chat mit unserem Support-Team.
            </p>
            <Button 
              onClick={startChat}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? 'Verbinde...' : 'Chat starten'}
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea ref={scrollAreaRef} className="h-80 w-full border rounded-lg p-3">
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
                      <p className={`text-xs mb-1 font-medium ${
                        message.sender_type === 'user' ? 'text-orange-100' : 'text-blue-600'
                      }`}>
                        {message.sender_name}
                      </p>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.message}
                      </div>
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
              <Textarea
                placeholder="Nachricht eingeben..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                rows={2}
              />
              <Button
                onClick={sendMessage}
                size="sm"
                disabled={!newMessage.trim() || isLoading}
                className="bg-orange-500 hover:bg-orange-600 self-end"
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
