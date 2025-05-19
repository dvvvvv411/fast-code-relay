
import { useState } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';

const PhoneNumberManager = () => {
  const { phoneNumbers, createPhoneNumber, updatePhoneNumber, deletePhoneNumber } = useSMS();
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [originalPhone, setOriginalPhone] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && accessCode) {
      if (editingPhone) {
        updatePhoneNumber(originalPhone, phone, accessCode);
        toast.success('Telefonnummer erfolgreich aktualisiert');
        setEditingPhone(null);
        setOriginalPhone('');
      } else {
        createPhoneNumber(phone, accessCode);
        toast.success('Telefonnummer erfolgreich erstellt');
      }
      setPhone('');
      setAccessCode('');
    }
  };

  const handleEdit = (phoneNumber: string, accessCode: string) => {
    setPhone(phoneNumber);
    setAccessCode(accessCode);
    setEditingPhone(phoneNumber);
    setOriginalPhone(phoneNumber);
  };

  const handleDelete = (phoneNumber: string) => {
    deletePhoneNumber(phoneNumber);
    toast.success('Telefonnummer erfolgreich gelöscht');
  };

  const cancelEdit = () => {
    setPhone('');
    setAccessCode('');
    setEditingPhone(null);
    setOriginalPhone('');
  };

  const phoneNumbersList = Object.values(phoneNumbers);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-medium">
            {editingPhone ? 'Telefonnummer bearbeiten' : 'Neue Telefonnummer erstellen'}
          </CardTitle>
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
            <div className="flex space-x-2">
              <Button type="submit" className="bg-orange hover:bg-orange-dark">
                <Plus className="mr-1" size={18} />
                {editingPhone ? 'Aktualisieren' : 'Telefonnummer hinzufügen'}
              </Button>
              {editingPhone && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Abbrechen
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-medium">Erstellte Telefonnummern</CardTitle>
        </CardHeader>
        <CardContent>
          {phoneNumbersList.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Keine Telefonnummern vorhanden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefonnummer</TableHead>
                  <TableHead>Zugangscode</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneNumbersList.map((item) => (
                  <TableRow key={item.phone}>
                    <TableCell className="font-medium">{item.phone}</TableCell>
                    <TableCell>{item.accessCode}</TableCell>
                    <TableCell>{item.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(item.phone, item.accessCode)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(item.phone)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneNumberManager;
