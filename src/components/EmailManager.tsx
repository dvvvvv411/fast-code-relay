
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Mail, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EmailPreviewDialog from './EmailPreviewDialog';

interface EmailFormData {
  recipientEmail: string;
  recipientFirstName: string;
  recipientLastName: string;
  assignmentId: string;
  phoneNumberId: string;
}

interface Assignment {
  id: string;
  assignment_url: string;
  worker_first_name: string;
  worker_last_name: string;
  auftrag_id: string;
  auftraege: {
    title: string;
    anbieter: string;
    auftragsnummer: string;
    projektziel: string;
  };
}

interface PhoneNumber {
  id: string;
  phone: string;
  access_code: string;
}

const EmailManager = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<PhoneNumber | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<EmailFormData>({
    defaultValues: {
      recipientEmail: '',
      recipientFirstName: '',
      recipientLastName: '',
      assignmentId: '',
      phoneNumberId: '',
    },
  });

  useEffect(() => {
    fetchAssignments();
    fetchAvailablePhoneNumbers();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('auftrag_assignments')
        .select(`
          id,
          assignment_url,
          worker_first_name,
          worker_last_name,
          auftrag_id,
          auftraege (
            title,
            anbieter,
            auftragsnummer,
            projektziel
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Fehler",
        description: "Aufträge konnten nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  const fetchAvailablePhoneNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('id, phone, access_code')
        .eq('is_used', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast({
        title: "Fehler",
        description: "Telefonnummern konnten nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  const handleAssignmentChange = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    setSelectedAssignment(assignment || null);
    form.setValue('assignmentId', assignmentId);
  };

  const handlePhoneNumberChange = (phoneNumberId: string) => {
    const phoneNumber = phoneNumbers.find(p => p.id === phoneNumberId);
    setSelectedPhoneNumber(phoneNumber || null);
    form.setValue('phoneNumberId', phoneNumberId);
  };

  const onSubmit = async (data: EmailFormData) => {
    if (!data.assignmentId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Auftrag aus.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const requestBody: any = {
        recipientEmail: data.recipientEmail,
        recipientFirstName: data.recipientFirstName,
        recipientLastName: data.recipientLastName,
        assignmentId: data.assignmentId,
      };

      // Only include phone number if one is selected
      if (data.phoneNumberId) {
        requestBody.phoneNumberId = data.phoneNumberId;
      }

      const { data: response, error } = await supabase.functions.invoke('send-assignment-email', {
        body: requestBody
      });

      if (error) {
        console.error('Error calling send-assignment-email function:', error);
        throw new Error(error.message || 'Fehler beim Versenden der E-Mail');
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Unbekannter Fehler beim Versenden der E-Mail');
      }

      toast({
        title: "Erfolg",
        description: "E-Mail wurde erfolgreich versendet!",
      });

      // Reset form
      form.reset();
      setSelectedAssignment(null);
      setSelectedPhoneNumber(null);

    } catch (error: any) {
      console.error('Error sending assignment email:', error);
      toast({
        title: "Fehler",
        description: error.message || "E-Mail konnte nicht versendet werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    const formData = form.getValues();
    if (!formData.assignmentId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Auftrag aus.",
        variant: "destructive",
      });
      return;
    }
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail versenden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recipientEmail"
                  rules={{ required: "E-Mail ist erforderlich" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empfänger E-Mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="beispiel@email.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="recipientFirstName"
                    rules={{ required: "Vorname ist erforderlich" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vorname</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Max" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recipientLastName"
                    rules={{ required: "Nachname ist erforderlich" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nachname</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Mustermann" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="assignmentId"
                rules={{ required: "Auftrag ist erforderlich" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auftrag</FormLabel>
                    <Select onValueChange={handleAssignmentChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Auftrag auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assignments.map((assignment) => (
                          <SelectItem key={assignment.id} value={assignment.id}>
                            {assignment.auftraege.title} - {assignment.worker_first_name} {assignment.worker_last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonnummer (optional)</FormLabel>
                    <Select onValueChange={handlePhoneNumberChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Telefonnummer auswählen (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Keine Telefonnummer</SelectItem>
                        {phoneNumbers.map((phone) => (
                          <SelectItem key={phone.id} value={phone.id}>
                            {phone.phone} (Code: {phone.access_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {isLoading ? "Wird versendet..." : "E-Mail versenden"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePreview}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  HTML Mail Preview
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <EmailPreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        formData={form.getValues()}
        assignment={selectedAssignment}
        phoneNumber={selectedPhoneNumber}
      />
    </div>
  );
};

export default EmailManager;
