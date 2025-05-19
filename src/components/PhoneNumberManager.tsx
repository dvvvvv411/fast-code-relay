
import { useState } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const PhoneNumberManager = () => {
  const { submitRequest } = useSMS();
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && accessCode) {
      submitRequest(phone, accessCode);
      setPhone('');
      setAccessCode('');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-medium">Neue Telefonnummer erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Telefonnummer
              </label>
              <Input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 123 456789"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="accessCode" className="text-sm font-medium">
                Zugangscode
              </label>
              <Input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="ABC123"
                required
              />
            </div>
            <Button type="submit" className="bg-orange hover:bg-orange-dark">
              <Plus className="mr-1" size={18} />
              Telefonnummer hinzufügen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneNumberManager;
