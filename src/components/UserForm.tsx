
import { useState, FormEvent } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Phone, Lock } from 'lucide-react';

const UserForm = () => {
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { submitRequest, currentRequest } = useSMS();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Ensure phone number has the +49 prefix
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+49')) {
      // If the user added their own country code, don't modify
      if (!formattedPhone.startsWith('+')) {
        // Remove leading zeros if present
        formattedPhone = formattedPhone.replace(/^0+/, '');
        // Add the +49 prefix
        formattedPhone = `+49${formattedPhone}`;
      }
    }
    
    if (formattedPhone && accessCode) {
      submitRequest(formattedPhone, accessCode);
      setIsSubmitted(true);
      
      // Show success toast
      toast({
        title: "Nummer wird aktiviert",
        description: "Ihre Nummer wird jetzt aktiviert.",
      });
    }
  };

  if (isSubmitted && currentRequest) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Nummer wird aktiviert</h2>
        <p className="mb-2">Telefonnummer: {currentRequest.phone}</p>
        <p className="mb-6">Zugangscode: {currentRequest.accessCode}</p>
        <Button
          onClick={() => setIsSubmitted(false)}
          variant="outline"
          className="mt-4"
        >
          Neue Nummer
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Telefonnummer
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+49"
            className="pl-10 w-full"
            required
          />
        </div>
        <p className="text-xs text-gray-500">+49 wird automatisch hinzugefügt</p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
          Zugangscode
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="accessCode"
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Ihr Zugangscode"
            className="pl-10 w-full"
            required
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full bg-orange hover:bg-orange-dark">
        Nummer aktivieren
      </Button>
    </form>
  );
};

export default UserForm;
