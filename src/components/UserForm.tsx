
import { useState, FormEvent } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const UserForm = () => {
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { submitRequest, currentRequest } = useSMS();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (phone && accessCode) {
      submitRequest(phone, accessCode);
      setIsSubmitted(true);
      
      // Show success toast
      toast({
        title: "Anfrage eingereicht",
        description: "Ihre Anfrage wird jetzt bearbeitet.",
      });
    }
  };

  if (isSubmitted && currentRequest) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Anfrage wird bearbeitet</h2>
        <p className="mb-2">Telefonnummer: {currentRequest.phone}</p>
        <p className="mb-6">Zugangscode: {currentRequest.accessCode}</p>
        <Button
          onClick={() => setIsSubmitted(false)}
          variant="outline"
          className="mt-4"
        >
          Neue Anfrage
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
        <Input
          id="phone"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ihre Telefonnummer"
          className="w-full"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
          Zugangscode
        </label>
        <Input
          id="accessCode"
          type="text"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Ihr Zugangscode"
          className="w-full"
          required
        />
      </div>
      
      <Button type="submit" className="w-full bg-orange hover:bg-orange-dark">
        Anfrage einreichen
      </Button>
    </form>
  );
};

export default UserForm;
