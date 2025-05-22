
import { useState } from 'react';
import { useSMS } from '@/context/SMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle } from 'lucide-react';

interface ProblemReportFormProps {
  phoneNumber?: string;
}

const ProblemReportForm = ({ phoneNumber = '' }: ProblemReportFormProps) => {
  const { submitSupportTicket } = useSMS();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(phoneNumber);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (firstName && lastName && email && phone && message) {
      submitSupportTicket({
        firstName,
        lastName,
        email,
        phone,
        message
      });
      
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setMessage('');
      
      // Close dialog
      setOpen(false);
      
      // Show success message
      toast({
        title: "Problemmeldung eingereicht",
        description: "Vielen Dank für Ihre Meldung. Wir werden uns schnellstmöglich bei Ihnen melden.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Probleme mit Ihrer Telefonnummer melden
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Probleme mit Ihrer Telefonnummer melden</DialogTitle>
          <DialogDescription>
            Bitte füllen Sie das Formular aus, um ein Problem mit Ihrer Telefonnummer zu melden.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Vorname
              </label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Nachname
              </label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-Mail
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Telefonnummer
            </label>
            <Input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Nachricht
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Beschreiben Sie Ihr Problem mit der Telefonnummer"
              className="min-h-[120px]"
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
              Absenden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProblemReportForm;
