
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Zap, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuickAddDialogProps {
  onQuickAdd: (phone: string, accessCode: string, sourceUrl: string, sourceDomain: string) => void;
}

const QuickAddDialog = ({ onQuickAdd }: QuickAddDialogProps) => {
  const [url, setUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const generateAccessCode = () => {
    // Generate 3 random uppercase letters (excluding I, L, O)
    const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generate 3 random numbers (excluding 0 and 1)
    const numbers = '23456789';
    for (let i = 0; i < 3; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return code;
  };

  const parseUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      const domain = urlObj.hostname;
      
      // Check if domain is supported
      const supportedDomains = ['sms-receive.net', 'receive-sms-online.info'];
      if (!supportedDomains.includes(domain)) {
        throw new Error(`Unsupported domain: ${domain}. Supported domains: ${supportedDomains.join(', ')}`);
      }

      // Extract phone parameter
      const phoneParam = urlObj.searchParams.get('phone');
      if (!phoneParam) {
        throw new Error('No phone parameter found in URL');
      }

      // Validate phone starts with 49
      if (!phoneParam.startsWith('49')) {
        throw new Error('Phone number must start with 49');
      }

      // Add + prefix
      const formattedPhone = '+' + phoneParam;

      return {
        phone: formattedPhone,
        domain: domain,
        sourceUrl: inputUrl
      };
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine URL ein",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsed = parseUrl(url.trim());
      const accessCode = generateAccessCode();
      
      onQuickAdd(parsed.phone, accessCode, parsed.sourceUrl, parsed.domain);
      
      toast({
        title: "Erfolg",
        description: `Telefonnummer ${parsed.phone} wurde erfolgreich hinzugefügt`,
      });
      
      setUrl('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Ungültige URL",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap size={16} />
          Quick Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quick Add - URL eingeben</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              SMS Service URL
            </label>
            <Input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://sms-receive.net/private.php?phone=4917688723925&key=..."
              className="w-full"
            />
            <div className="text-xs text-gray-500">
              Unterstützte Domains: sms-receive.net, receive-sms-online.info
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" className="bg-orange hover:bg-orange-dark">
              <Plus size={16} className="mr-1" />
              Hinzufügen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddDialog;
