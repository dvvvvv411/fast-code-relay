
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProblemReportFormProps {
  phone?: string;
}

const ProblemReportForm = ({ phone = '' }: ProblemReportFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userPhone, setUserPhone] = useState(phone);
  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userPhone || !issue) {
      toast({
        title: "Eingabefehler",
        description: "Bitte füllen Sie alle erforderlichen Felder aus.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('support_tickets')
        .insert([
          {
            phone: userPhone,
            issue,
            description: description || null
          }
        ]);
      
      if (error) throw error;
      
      toast({
        title: "Problem gemeldet",
        description: "Ihr Problem wurde erfolgreich gemeldet. Wir werden es so schnell wie möglich bearbeiten.",
      });
      
      // Reset form and close dialog
      setIssue('');
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting problem report:', error);
      toast({
        title: "Fehler",
        description: "Das Problem konnte nicht gemeldet werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <AlertCircle className="h-4 w-4" />
          Problem melden
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Problem melden</DialogTitle>
          <DialogDescription>
            Beschreiben Sie das Problem, das Sie mit dem SMS-Dienst haben.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Ihre Telefonnummer
            </label>
            <Input
              id="phone"
              type="text"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="+49 123 456789"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="issue" className="text-sm font-medium">
              Problemtyp
            </label>
            <Input
              id="issue"
              type="text"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="z.B. SMS Code nicht erhalten"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Beschreibung (optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bitte beschreiben Sie das Problem genauer..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-orange hover:bg-orange-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Wird gesendet...' : 'Problem melden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProblemReportForm;
