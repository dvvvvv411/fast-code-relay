
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Lightning, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuickAddDialogProps {
  onQuickAdd: (phone: string, accessCode: string, originalUrl: string, domain: string) => void;
  generateAccessCode: () => string;
}

export const QuickAddDialog = ({ onQuickAdd, generateAccessCode }: QuickAddDialogProps) => {
  const [url, setUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const parseUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      const domain = urlObj.hostname;
      
      // Check if domain is supported
      if (!['sms-receive.net', 'receive-sms-online.info'].includes(domain)) {
        throw new Error('Nicht unterstützte Domain. Nur sms-receive.net und receive-sms-online.info sind erlaubt.');
      }

      // Extract phone number
      const phoneParam = urlObj.searchParams.get('phone');
      if (!phoneParam) {
        throw new Error('Telefonnummer nicht in der URL gefunden (phone Parameter fehlt).');
      }

      // Check if phone starts with 49
      if (!phoneParam.startsWith('49')) {
        throw new Error('Telefonnummer muss mit 49 beginnen.');
      }

      // Add + prefix
      const formattedPhone = '+' + phoneParam;

      return {
        phone: formattedPhone,
        domain: domain,
        originalUrl: inputUrl
      };
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Ungültige URL. Bitte überprüfen Sie das Format.');
      }
      throw error;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine URL ein.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { phone, domain, originalUrl } = parseUrl(url);
      const accessCode = generateAccessCode();
      
      onQuickAdd(phone, accessCode, originalUrl, domain);
      
      toast({
        title: "Erfolg",
        description: `Telefonnummer ${phone} wurde hinzugefügt.`,
      });
      
      setUrl('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Lightning size={16} />
          Quick Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Telefonnummer per URL hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              URL eingeben
            </label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://sms-receive.net/private.php?phone=4917688723925&key=..."
              required
            />
            <p className="text-xs text-gray-500">
              Unterstützte Domains: sms-receive.net, receive-sms-online.info
            </p>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" className="bg-orange hover:bg-orange-dark flex items-center gap-2">
              <Plus size={16} />
              Hinzufügen
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setUrl('');
                setIsOpen(false);
              }}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
