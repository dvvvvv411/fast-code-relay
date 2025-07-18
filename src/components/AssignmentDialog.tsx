import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Copy, CheckCircle, Mail } from 'lucide-react';
import UserSelect from './UserSelect';
import { useUsers } from '@/hooks/useUsers';

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  auftragId: string;
  auftragTitle: string;
  onAssignmentCreated: () => void;
}

interface PhoneNumber {
  id: string;
  phone: string;
  access_code: string;
  is_used: boolean;
}

const AssignmentDialog = ({ isOpen, onClose, auftragId, auftragTitle, onAssignmentCreated }: AssignmentDialogProps) => {
  const [formData, setFormData] = useState({
    worker_first_name: '',
    worker_last_name: '',
    ident_code: '',
    ident_link: '',
    access_email: '',
    access_password: '',
    access_phone: '',
    anmeldename: '',
    assigned_user_id: undefined as string | undefined,
    phone_number_id: undefined as string | undefined
  });
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignmentUrl, setAssignmentUrl] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();
  const { data: users = [] } = useUsers();

  // Auto-fill worker name fields when a user is selected
  useEffect(() => {
    if (formData.assigned_user_id) {
      const selectedUser = users.find(user => user.id === formData.assigned_user_id);
      if (selectedUser && selectedUser.first_name && selectedUser.last_name) {
        setFormData(prev => ({
          ...prev,
          worker_first_name: selectedUser.first_name || '',
          worker_last_name: selectedUser.last_name || ''
        }));
      }
    }
  }, [formData.assigned_user_id, users]);

  // Auto-fill phone number field when a phone number is selected
  useEffect(() => {
    if (formData.phone_number_id) {
      const selectedPhoneNumber = phoneNumbers.find(phone => phone.id === formData.phone_number_id);
      if (selectedPhoneNumber) {
        setFormData(prev => ({
          ...prev,
          access_phone: selectedPhoneNumber.phone
        }));
      }
    }
  }, [formData.phone_number_id, phoneNumbers]);

  useEffect(() => {
    if (isOpen) {
      fetchPhoneNumbers();
    }
  }, [isOpen]);

  const fetchPhoneNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('id, phone, access_code, is_used')
        .eq('is_used', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast({
        title: "Fehler",
        description: "Telefonnummern konnten nicht geladen werden.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      worker_first_name: '',
      worker_last_name: '',
      ident_code: '',
      ident_link: '',
      access_email: '',
      access_password: '',
      access_phone: '',
      anmeldename: '',
      assigned_user_id: undefined,
      phone_number_id: undefined
    });
    setAssignmentUrl(null);
  };

  const copyLinkToClipboard = async (url: string, workerName: string) => {
    const fullUrl = `${window.location.origin}/assignment/${url}`;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Link automatisch kopiert",
        description: `Assignment-Link für ${workerName} wurde in die Zwischenablage kopiert`
      });
    } catch (error) {
      // Fallback for browsers without clipboard support
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Link kopiert",
        description: `Assignment-Link für ${workerName} wurde kopiert`
      });
    }
  };

  const sendAssignmentEmail = async (assignmentId: string, assignmentData: any) => {
    if (!formData.assigned_user_id) {
      console.log('No user selected, skipping email send');
      return;
    }

    const selectedUser = users.find(user => user.id === formData.assigned_user_id);
    if (!selectedUser || !selectedUser.email) {
      console.log('Selected user has no email address');
      toast({
        title: "Information",
        description: "Dem ausgewählten Benutzer kann keine E-Mail gesendet werden (keine E-Mail-Adresse hinterlegt).",
        variant: "default"
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      console.log('Sending assignment email to:', selectedUser.email);
      
      const emailPayload = {
        recipientEmail: selectedUser.email,
        recipientFirstName: selectedUser.first_name || formData.worker_first_name,
        recipientLastName: selectedUser.last_name || formData.worker_last_name,
        assignmentId: assignmentId,
        phoneNumberId: formData.phone_number_id || undefined
      };

      const { data, error } = await supabase.functions.invoke('send-assignment-email', {
        body: emailPayload
      });

      if (error) {
        console.error('Error sending assignment email:', error);
        throw error;
      }

      console.log('Assignment email sent successfully:', data);
      toast({
        title: "E-Mail gesendet",
        description: `Auftrags-E-Mail wurde erfolgreich an ${selectedUser.email} gesendet.`,
        duration: 5000
      });
    } catch (error) {
      console.error('Failed to send assignment email:', error);
      toast({
        title: "E-Mail-Fehler",
        description: "Die Auftrags-E-Mail konnte nicht gesendet werden. Der Auftrag wurde trotzdem erstellt.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
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
      const assignmentData = {
        auftrag_id: auftragId,
        worker_first_name: formData.worker_first_name.trim(),
        worker_last_name: formData.worker_last_name.trim(),
        ident_code: formData.ident_code.trim() || null,
        ident_link: formData.ident_link.trim() || null,
        access_email: formData.access_email.trim() || null,
        access_password: formData.access_password.trim() || null,
        access_phone: formData.access_phone.trim() || null,
        anmeldename: formData.anmeldename.trim() || null,
        assigned_user_id: formData.assigned_user_id || null,
        assignment_url: '' // Will be auto-generated by trigger
      };

      console.log('Creating assignment with data:', assignmentData);

      const { data, error } = await supabase
        .from('auftrag_assignments')
        .insert(assignmentData)
        .select()
        .single();

      if (error) {
        console.error('Assignment creation error:', error);
        throw error;
      }

      // If a phone number was selected, create a request entry
      if (formData.phone_number_id) {
        const { error: requestError } = await supabase
          .from('requests')
          .insert({
            phone_number_id: formData.phone_number_id,
            status: 'pending'
          });

        if (requestError) {
          console.error('Request creation error:', requestError);
          // Don't throw here, assignment was successful
          toast({
            title: "Warnung",
            description: "Auftrag wurde zugewiesen, aber SMS-Request konnte nicht erstellt werden.",
            variant: "destructive"
          });
        }
      }

      const workerName = `${formData.worker_first_name} ${formData.worker_last_name}`;
      
      toast({
        title: "Erfolg",
        description: `Auftrag wurde erfolgreich an ${workerName} zugewiesen.`,
        duration: 5000
      });

      // Store the assignment URL for display
      if (data.assignment_url) {
        setAssignmentUrl(data.assignment_url);
        await copyLinkToClipboard(data.assignment_url, workerName);
      }

      // Send email automatically if user is selected
      if (formData.assigned_user_id) {
        await sendAssignmentEmail(data.id, data);
      }

      console.log('Assignment created successfully:', data);
      onAssignmentCreated();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Fehler",
        description: "Auftragszuweisung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCopyLink = () => {
    if (assignmentUrl) {
      const workerName = `${formData.worker_first_name} ${formData.worker_last_name}`;
      copyLinkToClipboard(assignmentUrl, workerName);
    }
  };

  const selectedPhoneNumber = phoneNumbers.find(p => p.id === formData.phone_number_id);
  const selectedUser = users.find(user => user.id === formData.assigned_user_id);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-orange-500" />
            Auftrag zuweisen
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            <strong>{auftragTitle}</strong>
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>An registrierten Benutzer zuweisen (Optional)</Label>
            <UserSelect
              value={formData.assigned_user_id}
              onValueChange={(value) => setFormData({ ...formData, assigned_user_id: value })}
              placeholder="Benutzer auswählen..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Wenn ein Benutzer ausgewählt ist, werden die Namensfelder automatisch ausgefüllt und eine E-Mail gesendet.
            </p>
            {selectedUser && selectedUser.email && (
              <div className="mt-2 p-2 bg-blue-50 rounded border flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  E-Mail wird automatisch an {selectedUser.email} gesendet
                </span>
              </div>
            )}
            {selectedUser && !selectedUser.email && (
              <div className="mt-2 p-2 bg-yellow-50 rounded border">
                <span className="text-sm text-yellow-800">
                  Benutzer hat keine E-Mail-Adresse hinterlegt
                </span>
              </div>
            )}
          </div>

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
            <Label>Telefonnummer auswählen (Optional)</Label>
            <Select
              value={formData.phone_number_id}
              onValueChange={(value) => setFormData({ ...formData, phone_number_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Telefonnummer auswählen..." />
              </SelectTrigger>
              <SelectContent className="bg-white shadow-lg border border-gray-200 z-50">
                {phoneNumbers.map((phoneNumber) => (
                  <SelectItem key={phoneNumber.id} value={phoneNumber.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{phoneNumber.phone}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        Code: {phoneNumber.access_code}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {phoneNumbers.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Keine verfügbaren Telefonnummern gefunden.
              </p>
            )}
            {selectedPhoneNumber && (
              <div className="mt-2 p-2 bg-blue-50 rounded border">
                <p className="text-sm text-blue-800">
                  <strong>Ausgewählt:</strong> {selectedPhoneNumber.phone}
                </p>
                <p className="text-xs text-blue-600">
                  Zugangscode: {selectedPhoneNumber.access_code}
                </p>
              </div>
            )}
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

          {assignmentUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Auftrag erfolgreich zugewiesen!</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={`${window.location.origin}/assignment/${assignmentUrl}`}
                  readOnly
                  className="text-xs bg-white"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="bg-orange hover:bg-orange-dark flex-1"
              disabled={isSubmitting || isSendingEmail}
            >
              {isSubmitting ? 'Erstelle...' : isSendingEmail ? 'Sende E-Mail...' : 'Auftrag zuweisen'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              {assignmentUrl ? 'Schließen' : 'Abbrechen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDialog;
