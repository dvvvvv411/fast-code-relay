import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Save, X } from 'lucide-react';

interface EditAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  onAssignmentUpdated: () => void;
}

interface AssignmentData {
  id: string;
  worker_first_name: string;
  worker_last_name: string;
  ident_code: string | null;
  ident_link: string | null;
  access_email: string | null;
  access_password: string | null;
  access_phone: string | null;
  anmeldename: string | null;
}

const EditAssignmentDialog = ({ isOpen, onClose, assignmentId, onAssignmentUpdated }: EditAssignmentDialogProps) => {
  const [formData, setFormData] = useState({
    worker_first_name: '',
    worker_last_name: '',
    ident_code: '',
    ident_link: '',
    access_email: '',
    access_password: '',
    access_phone: '',
    anmeldename: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && assignmentId) {
      fetchAssignmentData();
    }
  }, [isOpen, assignmentId]);

  const fetchAssignmentData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('auftrag_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (error) throw error;

      setFormData({
        worker_first_name: data.worker_first_name || '',
        worker_last_name: data.worker_last_name || '',
        ident_code: data.ident_code || '',
        ident_link: data.ident_link || '',
        access_email: data.access_email || '',
        access_password: data.access_password || '',
        access_phone: data.access_phone || '',
        anmeldename: data.anmeldename || ''
      });
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast({
        title: "Fehler",
        description: "Zuweisung konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.worker_first_name.trim() || !formData.worker_last_name.trim()) {
      toast({
        title: "Fehler",
        description: "Vor- und Nachname sind erforderlich.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData = {
        worker_first_name: formData.worker_first_name.trim(),
        worker_last_name: formData.worker_last_name.trim(),
        ident_code: formData.ident_code.trim() || null,
        ident_link: formData.ident_link.trim() || null,
        access_email: formData.access_email.trim() || null,
        access_password: formData.access_password.trim() || null,
        access_phone: formData.access_phone.trim() || null,
        anmeldename: formData.anmeldename.trim() || null
      };

      const { error } = await supabase
        .from('auftrag_assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Zuweisung wurde erfolgreich aktualisiert.",
        duration: 3000
      });

      onAssignmentUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Fehler",
        description: "Zuweisung konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-orange-500" />
            Zuweisung bearbeiten
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="text-gray-500">Lade Daten...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="worker_first_name">Vorname *</Label>
                <Input
                  id="worker_first_name"
                  value={formData.worker_first_name}
                  onChange={(e) => setFormData({ ...formData, worker_first_name: e.target.value })}
                  required
                  placeholder="Max"
                />
              </div>
              <div>
                <Label htmlFor="worker_last_name">Nachname *</Label>
                <Input
                  id="worker_last_name"
                  value={formData.worker_last_name}
                  onChange={(e) => setFormData({ ...formData, worker_last_name: e.target.value })}
                  required
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ident_code">Ident Code (Optional)</Label>
              <Input
                id="ident_code"
                value={formData.ident_code}
                onChange={(e) => setFormData({ ...formData, ident_code: e.target.value })}
                placeholder="z.B. ID12345"
              />
            </div>

            <div>
              <Label htmlFor="ident_link">Identlink (Optional)</Label>
              <Input
                id="ident_link"
                value={formData.ident_link}
                onChange={(e) => setFormData({ ...formData, ident_link: e.target.value })}
                placeholder="z.B. https://example.com/ident"
              />
            </div>

            <div>
              <Label htmlFor="access_email">E-Mail (Optional)</Label>
              <Input
                id="access_email"
                type="email"
                value={formData.access_email}
                onChange={(e) => setFormData({ ...formData, access_email: e.target.value })}
                placeholder="beispiel@email.de"
              />
            </div>

            <div>
              <Label htmlFor="access_password">Passwort (Optional)</Label>
              <Input
                id="access_password"
                type="password"
                value={formData.access_password}
                onChange={(e) => setFormData({ ...formData, access_password: e.target.value })}
                placeholder="Zugangsdaten"
              />
            </div>

            <div>
              <Label htmlFor="access_phone">Telefonnummer (Optional)</Label>
              <Input
                id="access_phone"
                type="tel"
                value={formData.access_phone}
                onChange={(e) => setFormData({ ...formData, access_phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>

            <div>
              <Label htmlFor="anmeldename">Anmeldename (Optional)</Label>
              <Input
                id="anmeldename"
                value={formData.anmeldename}
                onChange={(e) => setFormData({ ...formData, anmeldename: e.target.value })}
                placeholder="Benutzername"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                className="bg-orange hover:bg-orange-dark flex-1"
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Speichere...' : 'Speichern'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditAssignmentDialog;