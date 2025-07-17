import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TelegramChatId {
  id: string;
  chat_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TelegramManager = () => {
  const [chatIds, setChatIds] = useState<TelegramChatId[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    chat_id: '',
    name: '',
    description: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchChatIds();
  }, []);

  const fetchChatIds = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_chat_ids')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChatIds(data || []);
    } catch (error) {
      console.error('Error fetching chat IDs:', error);
      toast({
        title: 'Fehler beim Laden',
        description: 'Telegram Chat IDs konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('telegram_chat_ids')
          .update({
            chat_id: formData.chat_id,
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active
          })
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: 'Erfolgreich aktualisiert',
          description: 'Chat ID wurde erfolgreich aktualisiert.'
        });
      } else {
        const { error } = await supabase
          .from('telegram_chat_ids')
          .insert({
            chat_id: formData.chat_id,
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active
          });

        if (error) throw error;

        toast({
          title: 'Erfolgreich hinzugefügt',
          description: 'Neue Chat ID wurde erfolgreich hinzugefügt.'
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchChatIds();
    } catch (error: any) {
      console.error('Error saving chat ID:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: error.message || 'Chat ID konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (chatId: TelegramChatId) => {
    setEditingId(chatId.id);
    setFormData({
      chat_id: chatId.chat_id,
      name: chatId.name,
      description: chatId.description || '',
      is_active: chatId.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Chat ID löschen möchten?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('telegram_chat_ids')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Erfolgreich gelöscht',
        description: 'Chat ID wurde erfolgreich gelöscht.'
      });

      fetchChatIds();
    } catch (error: any) {
      console.error('Error deleting chat ID:', error);
      toast({
        title: 'Fehler beim Löschen',
        description: error.message || 'Chat ID konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('telegram_chat_ids')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status geändert',
        description: `Chat ID wurde ${!currentStatus ? 'aktiviert' : 'deaktiviert'}.`
      });

      fetchChatIds();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht geändert werden.',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      chat_id: '',
      name: '',
      description: '',
      is_active: true
    });
    setEditingId(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Lade Telegram Chat IDs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Telegram Chat IDs</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Telegram Chat IDs für Benachrichtigungen
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Chat ID hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Chat ID bearbeiten' : 'Neue Chat ID hinzufügen'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="chat_id">Chat ID *</Label>
                <Input
                  id="chat_id"
                  value={formData.chat_id}
                  onChange={(e) => setFormData({ ...formData, chat_id: e.target.value })}
                  placeholder="z.B. -1001234567890"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Admin Gruppe"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optionale Beschreibung für diese Chat ID"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Aktiv</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">
                  {editingId ? 'Aktualisieren' : 'Hinzufügen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {chatIds.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Chat IDs vorhanden</h3>
              <p className="text-muted-foreground text-center mb-4">
                Fügen Sie Ihre erste Telegram Chat ID hinzu, um Benachrichtigungen zu erhalten.
              </p>
            </CardContent>
          </Card>
        ) : (
          chatIds.map((chatId) => (
            <Card key={chatId.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg">{chatId.name}</CardTitle>
                  <Badge variant={chatId.is_active ? 'default' : 'secondary'}>
                    {chatId.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={chatId.is_active}
                    onCheckedChange={() => toggleActive(chatId.id, chatId.is_active)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(chatId)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(chatId.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Chat ID:</span>
                    <code className="ml-2 px-2 py-1 bg-muted rounded text-sm">
                      {chatId.chat_id}
                    </code>
                  </div>
                  
                  {chatId.description && (
                    <div>
                      <span className="font-medium">Beschreibung:</span>
                      <span className="ml-2 text-muted-foreground">{chatId.description}</span>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Erstellt: {new Date(chatId.created_at).toLocaleString('de-DE')}
                    {chatId.updated_at !== chatId.created_at && (
                      <span className="ml-4">
                        Zuletzt aktualisiert: {new Date(chatId.updated_at).toLocaleString('de-DE')}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TelegramManager;