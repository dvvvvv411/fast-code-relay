
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Save, X, Eye, ExternalLink } from 'lucide-react';
import { Auftrag, AuftragFormData, Anweisung } from '@/types/auftrag';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import AnweisungenBuilder from '@/components/AnweisungenBuilder';

const AuftraegeManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<AuftragFormData>({
    title: '',
    auftragsnummer: '',
    anbieter: '',
    projektziel: '',
    app_store_link: '',
    google_play_link: '',
    show_download_links: true,
    anweisungen: [],
    kontakt_name: 'Friedrich Hautmann',
    kontakt_email: 'f.hautmann@sls-advisors.net',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: auftraege, isLoading } = useQuery({
    queryKey: ['auftraege'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auftraege')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Auftrag[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AuftragFormData) => {
      const { error } = await supabase
        .from('auftraege')
        .insert([{
          ...data,
          anweisungen: JSON.stringify(data.anweisungen),
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auftraege'] });
      resetForm();
      toast({ title: 'Auftrag erstellt', description: 'Der Auftrag wurde erfolgreich erstellt.' });
    },
    onError: () => {
      toast({ title: 'Fehler', description: 'Fehler beim Erstellen des Auftrags.', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AuftragFormData }) => {
      const { error } = await supabase
        .from('auftraege')
        .update({
          ...data,
          anweisungen: JSON.stringify(data.anweisungen),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auftraege'] });
      resetForm();
      toast({ title: 'Auftrag aktualisiert', description: 'Der Auftrag wurde erfolgreich aktualisiert.' });
    },
    onError: () => {
      toast({ title: 'Fehler', description: 'Fehler beim Aktualisieren des Auftrags.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('auftraege')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auftraege'] });
      toast({ title: 'Auftrag gelöscht', description: 'Der Auftrag wurde erfolgreich gelöscht.' });
    },
    onError: () => {
      toast({ title: 'Fehler', description: 'Fehler beim Löschen des Auftrags.', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      auftragsnummer: '',
      anbieter: '',
      projektziel: '',
      app_store_link: '',
      google_play_link: '',
      show_download_links: true,
      anweisungen: [],
      kontakt_name: 'Friedrich Hautmann',
      kontakt_email: 'f.hautmann@sls-advisors.net',
    });
    setEditingId(null);
    setIsCreating(false);
  };

  const startEditing = (auftrag: Auftrag) => {
    setFormData({
      title: auftrag.title,
      auftragsnummer: auftrag.auftragsnummer,
      anbieter: auftrag.anbieter,
      projektziel: auftrag.projektziel,
      app_store_link: auftrag.app_store_link || '',
      google_play_link: auftrag.google_play_link || '',
      show_download_links: auftrag.show_download_links,
      anweisungen: auftrag.anweisungen,
      kontakt_name: auftrag.kontakt_name,
      kontakt_email: auftrag.kontakt_email,
    });
    setEditingId(auftrag.id);
    setIsCreating(false);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAnweisungenChange = (anweisungen: Anweisung[]) => {
    setFormData(prev => ({ ...prev, anweisungen }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Aufträge verwalten</h2>
        <Button onClick={() => setIsCreating(true)} className="bg-orange hover:bg-orange-dark">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Auftrag
        </Button>
      </div>

      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Auftrag bearbeiten' : 'Neuer Auftrag'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Grunddaten</TabsTrigger>
                <TabsTrigger value="instructions">Anweisungen</TabsTrigger>
                <TabsTrigger value="contact">Kontakt</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="z.B. XXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="auftragsnummer">Auftragsnummer</Label>
                    <Input
                      id="auftragsnummer"
                      value={formData.auftragsnummer}
                      onChange={(e) => setFormData(prev => ({ ...prev, auftragsnummer: e.target.value }))}
                      placeholder="z.B. 093399: XXX"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="anbieter">Anbieter</Label>
                  <Input
                    id="anbieter"
                    value={formData.anbieter}
                    onChange={(e) => setFormData(prev => ({ ...prev, anbieter: e.target.value }))}
                    placeholder="z.B. Google"
                  />
                </div>

                <div>
                  <Label htmlFor="projektziel">Projektziel</Label>
                  <Textarea
                    id="projektziel"
                    value={formData.projektziel}
                    onChange={(e) => setFormData(prev => ({ ...prev, projektziel: e.target.value }))}
                    placeholder="Beschreibung des Projektziels..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_download_links"
                    checked={formData.show_download_links}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_download_links: checked }))}
                  />
                  <Label htmlFor="show_download_links">Download-Links anzeigen</Label>
                </div>

                {formData.show_download_links && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="app_store_link">App Store Link</Label>
                      <Input
                        id="app_store_link"
                        value={formData.app_store_link}
                        onChange={(e) => setFormData(prev => ({ ...prev, app_store_link: e.target.value }))}
                        placeholder="https://apps.apple.com/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="google_play_link">Google Play Store Link</Label>
                      <Input
                        id="google_play_link"
                        value={formData.google_play_link}
                        onChange={(e) => setFormData(prev => ({ ...prev, google_play_link: e.target.value }))}
                        placeholder="https://play.google.com/..."
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="instructions">
                <AnweisungenBuilder
                  anweisungen={formData.anweisungen}
                  onChange={handleAnweisungenChange}
                />
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div>
                  <Label htmlFor="kontakt_name">Kontakt Name</Label>
                  <Input
                    id="kontakt_name"
                    value={formData.kontakt_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, kontakt_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="kontakt_email">Kontakt Email</Label>
                  <Input
                    id="kontakt_email"
                    type="email"
                    value={formData.kontakt_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, kontakt_email: e.target.value }))}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleSubmit} className="bg-orange hover:bg-orange-dark">
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {auftraege?.map((auftrag) => (
          <Card key={auftrag.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {auftrag.auftragsnummer}: {auftrag.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{auftrag.anbieter}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/auftrag/${auftrag.id}`, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(auftrag)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Sind Sie sicher, dass Sie diesen Auftrag löschen möchten?')) {
                        deleteMutation.mutate(auftrag.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 line-clamp-2">{auftrag.projektziel}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>{auftrag.anweisungen.length} Anweisungen</span>
                <span>Erstellt: {new Date(auftrag.created_at).toLocaleDateString('de-DE')}</span>
                {auftrag.show_download_links && <span>Download-Links aktiv</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AuftraegeManager;
