
import { useState, FormEvent, useRef, useEffect } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UserForm = () => {
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { submitRequest, currentRequest, isLoading } = useSMS();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Restore submitted state from current request
  useEffect(() => {
    if (currentRequest) {
      setIsSubmitted(true);
    }
  }, [currentRequest]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
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
      const success = await submitRequest(formattedPhone, accessCode);
      if (success) {
        setIsSubmitted(true);
      }
    } else {
      setError('Bitte geben Sie eine Telefonnummer und einen Zugangscode ein.');
    }
  };

  const handlePhoneFieldFocus = () => {
    // If the field is empty, add +49 when focused
    if (!phone) {
      setPhone('+49');
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
  };

  if (isSubmitted && currentRequest) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Nummer wird aktiviert</h2>
        <p className="mb-2">Telefonnummer: {currentRequest.phone}</p>
        <p className="mb-6">Zugangscode: {currentRequest.accessCode}</p>
        <Button
          onClick={handleReset}
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
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
            onFocus={handlePhoneFieldFocus}
            placeholder="+49"
            className="pl-10 w-full"
            ref={phoneInputRef}
            required
            disabled={isLoading}
          />
        </div>
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
            disabled={isLoading}
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-orange hover:bg-orange-dark"
        disabled={isLoading}
      >
        {isLoading ? 'Verarbeite...' : 'Nummer aktivieren'}
      </Button>
    </form>
  );
};

export default UserForm;
