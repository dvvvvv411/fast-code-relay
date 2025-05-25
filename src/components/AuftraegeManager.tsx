
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, Plus, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import InstructionsBuilder from './InstructionsBuilder';

interface Auftrag {
  id: string;
  title: string;
  auftragsnummer: string;
  anbieter: string;
  projektziel: string;
  app_store_link: string | null;
  google_play_link: string | null;
  show_download_links: boolean;
  anweisungen: any[];
  kontakt_name: string;
  kontakt_email: string;
  ident_code: string | null;
  access_email: string | null;
  access_password: string | null;
  access_phone: string | null;
  created_at: string;
}

const AuftraegeManager = () => {
  const [auftraege, setAuftraege] = useState<Auftrag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAuftrag, setEditingAuftrag] = useState<Auftrag | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
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
    ident_code: '',
    access_email: '',
    access_password: '',
    access_phone: ''
  });

  useEffect(() => {
    fetchAuftraege();
  }, []);

  const fetchAuftraege = async () => {
    try {
      const { data, error } = await supabase
        .from('auftraege')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the anweisungen field to ensure it's an array
      const typedData = (data || []).map(item => ({
        ...item,
        anweisungen: Array.isArray(item.anweisungen) ? item.anweisungen : []
      }));
      
      setAuftraege(typedData);
    } catch (error) {
      console.error('Error fetching auftraege:', error);
      toast({
        title: "Fehler",
        description: "Aufträge konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      ident_code: '',
      access_email: '',
      access_password: '',
      access_phone: ''
    });
    setEditingAuftrag(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Clean up empty string values to null for optional fields
      const cleanedData = {
        ...formData,
        app_store_link: formData.app_store_link || null,
        google_play_link: formData.google_play_link || null,
        ident_code: formData.ident_code || null,
        access_email: formData.access_email || null,
        access_password: formData.access_password || null,
        access_phone: formData.access_phone || null
      };
      
      if (editingAuftrag) {
        const { error } = await supabase
          .from('auftraege')
          .update(cleanedData)
          .eq('id', editingAuftrag.id);
        
        if (error) throw error;
        
        toast({
          title: "Erfolg",
          description: "Auftrag wurde aktualisiert."
        });
      } else {
        const { error } = await supabase
          .from('auftraege')
          .insert([cleanedData]);
        
        if (error) throw error;
        
        toast({
          title: "Erfolg",
          description: "Auftrag wurde erstellt."
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchAuftraege();
    } catch (error) {
      console.error('Error saving auftrag:', error);
      toast({
        title: "Fehler",
        description: "Auftrag konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (auftrag: Auftrag) => {
    setEditingAuftrag(auftrag);
    setFormData({
      title: auftrag.title,
      auftragsnummer: auftrag.auftragsnummer,
      anbieter: auftrag.anbieter,
      projektziel: auftrag.projektziel,
      app_store_link: auftrag.app_store_link || '',
      google_play_link: auftrag.google_play_link || '',
      show_download_links: auftrag.show_download_links,
      anweisungen: Array.isArray(auftrag.anweisungen) ? auftrag.anweisungen : [],
      kontakt_name: auftrag.kontakt_name,
      kontakt_email: auftrag.kontakt_email,
      ident_code: auftrag.ident_code || '',
      access_email: auftrag.access_email || '',
      access_password: auftrag.access_password || '',
      access_phone: auftrag.access_phone || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Auftrag löschen möchten?')) return;
    
    try {
      const { error } = await supabase
        .from('auftraege')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Erfolg",
        description: "Auftrag wurde gelöscht."
      });
      
      fetchAuftraege();
    } catch (error) {
      console.error('Error deleting auftrag:', error);
      toast({
        title: "Fehler",
        description: "Auftrag konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  const handleViewAuftrag = (id: string) => {
    window.open(`/auftrag/${id}`, '_blank');
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Lade Aufträge...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Aufträge verwalten</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-orange hover:bg-orange-dark">
              <Plus className="h-4 w-4 mr-2" />
              Neuen Auftrag erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAuftrag ? 'Auftrag bearbeiten' : 'Neuen Auftrag erstellen'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="auftragsnummer">Auftragsnummer</Label>
                  <Input
                    id="auftragsnummer"
                    value={formData.auftragsnummer}
                    onChange={(e) => setFormData({ ...formData, auftragsnummer: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="anbieter">Anbieter</Label>
                <Input
                  id="anbieter"
                  value={formData.anbieter}
                  onChange={(e) => setFormData({ ...formData, anbieter: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="projektziel">Projektziel</Label>
                <Textarea
                  id="projektziel"
                  value={formData.projektziel}
                  onChange={(e) => setFormData({ ...formData, projektziel: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              {/* Zugangsdaten Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Zugangsdaten (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ident_code">Ident Code</Label>
                    <Input
                      id="ident_code"
                      value={formData.ident_code}
                      onChange={(e) => setFormData({ ...formData, ident_code: e.target.value })}
                      placeholder="z.B. ID123456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="access_email">E-Mail</Label>
                    <Input
                      id="access_email"
                      type="email"
                      value={formData.access_email}
                      onChange={(e) => setFormData({ ...formData, access_email: e.target.value })}
                      placeholder="beispiel@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="access_password">Passwort</Label>
                    <Input
                      id="access_password"
                      type="password"
                      value={formData.access_password}
                      onChange={(e) => setFormData({ ...formData, access_password: e.target.value })}
                      placeholder="Passwort eingeben"
                    />
                  </div>
                  <div>
                    <Label htmlFor="access_phone">Telefonnummer</Label>
                    <Input
                      id="access_phone"
                      value={formData.access_phone}
                      onChange={(e) => setFormData({ ...formData, access_phone: e.target.value })}
                      placeholder="+49 123 456789"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_download_links"
                  checked={formData.show_download_links}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_download_links: checked })}
                />
                <Label htmlFor="show_download_links">Download-Links anzeigen</Label>
              </div>

              {formData.show_download_links && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="app_store_link">App Store Link</Label>
                    <Input
                      id="app_store_link"
                      value={formData.app_store_link}
                      onChange={(e) => setFormData({ ...formData, app_store_link: e.target.value })}
                      placeholder="https://apps.apple.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="google_play_link">Google Play Link</Label>
                    <Input
                      id="google_play_link"
                      value={formData.google_play_link}
                      onChange={(e) => setFormData({ ...formData, google_play_link: e.target.value })}
                      placeholder="https://play.google.com/..."
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Anweisungen</Label>
                <InstructionsBuilder
                  instructions={formData.anweisungen}
                  onChange={(instructions) => setFormData({ ...formData, anweisungen: instructions })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kontakt_name">Kontakt Name</Label>
                  <Input
                    id="kontakt_name"
                    value={formData.kontakt_name}
                    onChange={(e) => setFormData({ ...formData, kontakt_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="kontakt_email">Kontakt E-Mail</Label>
                  <Input
                    id="kontakt_email"
                    type="email"
                    value={formData.kontakt_email}
                    onChange={(e) => setFormData({ ...formData, kontakt_email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-orange hover:bg-orange-dark">
                  {editingAuftrag ? 'Aktualisieren' : 'Erstellen'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {auftraege.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Noch keine Aufträge erstellt.</p>
            </CardContent>
          </Card>
        ) : (
          auftraege.map((auftrag) => (
            <Card key={auftrag.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{auftrag.title}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAuftrag(auftrag.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(auftrag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(auftrag.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Auftragsnummer:</strong> {auftrag.auftragsnummer}
                  </div>
                  <div>
                    <strong>Anbieter:</strong> {auftrag.anbieter}
                  </div>
                  <div className="col-span-2">
                    <strong>Projektziel:</strong> {auftrag.projektziel.substring(0, 100)}...
                  </div>
                  <div>
                    <strong>Erstellt:</strong> {new Date(auftrag.created_at).toLocaleDateString('de-DE')}
                  </div>
                  <div>
                    <strong>Download-Links:</strong> {auftrag.show_download_links ? 'Ja' : 'Nein'}
                  </div>
                  {(auftrag.ident_code || auftrag.access_email || auftrag.access_password || auftrag.access_phone) && (
                    <div className="col-span-2">
                      <strong>Zugangsdaten:</strong> Vorhanden
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AuftraegeManager;
