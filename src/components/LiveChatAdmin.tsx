
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, User, UserCheck, Clock, X, RefreshCw, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLiveChatRealtime } from '@/hooks/useLiveChatRealtime';
import { useToast } from '@/hooks/use-toast';

interface LiveChat {
  id: string;
  assignment_id: string | null;
  session_id: string;
  worker_name: string;
  status: string;
  created_at: string;
  closed_at: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  message: string;
  sender_type: 'user' | 'admin';
  sender_name: string;
  created_at: string;
  isOptimistic?: boolean;
}

const LiveChatAdmin = () => {
  const [activeChats, setActiveChats] = useState<LiveChat[]>([]);
  const [closedChats, setClosedChats] = useState<LiveChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<LiveChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showClosedChats, setShowClosedChats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // Handle new chats from realtime
  const handleNewChat = (newChat: LiveChat) => {
    setActiveChats(prev => {
      const chatExists = prev.some(chat => chat.id === newChat.id);
      if (chatExists) return prev;
      
      toast({
        title: "Neuer Chat",
        description: `${newChat.worker_name} hat einen Chat gestartet.`,
      });
      
      return [newChat, ...prev];
    });
  };

  // Handle chat updates from realtime
  const handleChatUpdate = (updatedChat: LiveChat) => {
    // Update active chats - remove if closed
    setActiveChats(prev => prev.map(chat => 
      chat.id === updatedChat.id ? updatedChat : chat
    ).filter(chat => chat.status === 'active'));

    // Update closed chats - add if newly closed
    if (updatedChat.status === 'closed') {
      setClosedChats(prev => {
        const chatExists = prev.some(chat => chat.id === updatedChat.id);
        if (chatExists) {
          return prev.map(chat => chat.id === updatedChat.id ? updatedChat : chat);
        }
        return [updatedChat, ...prev];
      });
    }

    // If selected chat was closed, clear selection
    if (selectedChat?.id === updatedChat.id && updatedChat.status === 'closed') {
      setSelectedChat(null);
      setMessages([]);
    }

    // Update selected chat if it matches
    if (selectedChat?.id === updatedChat.id) {
      setSelectedChat(updatedChat);
    }
  };

  // Set up real-time subscriptions
  useLiveChatRealtime({
    chatId: selectedChat?.id,
    onNewMessage: handleNewMessage,
    onNewChat: handleNewChat,
    onChatUpdate: handleChatUpdate
  });

  // Fetch active chats
  const fetchActiveChats = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      
      const { data, error } = await supabase
        .from('live_chats')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveChats(data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching active chats:', error);
      toast({
        title: "Fehler",
        description: "Aktive Chats konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  // Fetch closed chats
  const fetchClosedChats = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      
      const { data, error } = await supabase
        .from('live_chats')
        .select('*')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false });

      if (error) throw error;
      setClosedChats(data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching closed chats:', error);
      toast({
        title: "Fehler",
        description: "Abgeschlossene Chats konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      if (showLoader) setIsLoading(false);
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
      
      const typedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'user' | 'admin'
      }));
      
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Fehler",
        description: "Nachrichten konnten nicht geladen werden.",
        variant: "destructive"
      });
    }
  };

  // Reset unread count when admin selects a chat
  const resetUnreadCount = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('live_chats')
        .update({ unread_count: 0 })
        .eq('id', chatId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resetting unread count:', error);
    }
  };

  // Handle chat selection
  const handleChatSelection = (chat: LiveChat) => {
    setSelectedChat(chat);
    
    // Reset unread count when admin views the chat (only for active chats)
    if (chat.status === 'active' && chat.unread_count > 0) {
      resetUnreadCount(chat.id);
      // Update local state immediately for better UX
      setActiveChats(prev => prev.map(c => 
        c.id === chat.id ? { ...c, unread_count: 0 } : c
      ));
    }
  };

  // Send message as admin
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isLoading || selectedChat.status === 'closed') return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Add optimistic message immediately with unique ID
    const timestamp = Date.now();
    const optimisticMessage: Message = {
      id: `temp-${timestamp}`,
      message: messageText,
      sender_type: 'admin',
      sender_name: 'Support Team',
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .insert({
          chat_id: selectedChat.id,
          message: messageText,
          sender_type: 'admin',
          sender_name: 'Support Team'
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

  // Close chat
  const closeChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('live_chats')
        .update({ 
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) throw error;

      toast({
        title: "Chat beendet",
        description: "Der Chat wurde erfolgreich beendet.",
      });

    } catch (error) {
      console.error('Error closing chat:', error);
      toast({
        title: "Fehler",
        description: "Chat konnte nicht beendet werden.",
        variant: "destructive"
      });
    }
  };

  // Toggle between active and closed chats
  const toggleChatView = () => {
    setShowClosedChats(!showClosedChats);
    setSelectedChat(null);
    setMessages([]);
  };

  // Initial data fetch
  useEffect(() => {
    fetchActiveChats();
    fetchClosedChats();
  }, []);

  // Refresh data when view toggles
  useEffect(() => {
    if (showClosedChats) {
      fetchClosedChats(false);
    } else {
      fetchActiveChats(false);
    }
  }, [showClosedChats]);

  // Auto-fetch messages when chat selection changes
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  const currentChats = showClosedChats ? closedChats : activeChats;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              {showClosedChats ? 'Abgeschlossene Chats' : 'Aktive Chats'} ({currentChats.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={showClosedChats ? "outline" : "default"}
                size="sm"
                onClick={toggleChatView}
                className="flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                {showClosedChats ? 'Aktive' : 'Beendet'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => showClosedChats ? fetchClosedChats(false) : fetchActiveChats(false)}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Zuletzt aktualisiert: {lastRefresh.toLocaleTimeString()}
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {currentChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedChat?.id === chat.id
                      ? 'bg-orange-50 border-orange-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleChatSelection(chat)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{chat.worker_name}</p>
                      {!showClosedChats && chat.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {chat.unread_count} neue
                        </Badge>
                      )}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={showClosedChats ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700"}
                    >
                      {showClosedChats ? 'Beendet' : 'Aktiv'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {showClosedChats && chat.closed_at
                      ? `Beendet: ${new Date(chat.closed_at).toLocaleString()}`
                      : `Gestartet: ${new Date(chat.created_at).toLocaleString()}`
                    }
                  </div>
                </div>
              ))}
              {currentChats.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{showClosedChats ? 'Keine abgeschlossenen Chats' : 'Keine aktiven Chats'}</p>
                </div>
              )}
              {isLoading && (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>Lade Chats...</p>
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
                  {selectedChat.status === 'closed' && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 ml-2">
                      Beendet
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  Chat auswählen
                </>
              )}
            </CardTitle>
            {selectedChat && selectedChat.status === 'active' && (
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
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {message.message}
                        </div>
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
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {selectedChat.status === 'active' ? (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Nachricht als Support-Team senden... (Shift+Enter für neue Zeile)"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className="bg-blue-500 hover:bg-blue-600 self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">
                    Dieser Chat wurde beendet. Es können keine neuen Nachrichten gesendet werden.
                  </p>
                  {selectedChat.closed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Beendet am: {new Date(selectedChat.closed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
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
