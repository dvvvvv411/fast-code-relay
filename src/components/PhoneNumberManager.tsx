
import { useState } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash, Loader, CheckCircle, XCircle } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const PhoneNumberManager = () => {
  const { phoneNumbers, createPhoneNumber, updatePhoneNumber, deletePhoneNumber, isLoading } = useSMS();
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && accessCode) {
      if (editingId) {
        updatePhoneNumber(editingId, phone, accessCode);
        setEditingId(null);
      } else {
        createPhoneNumber(phone, accessCode);
      }
      setPhone('');
      setAccessCode('');
    }
  };

  const handleEdit = (phoneNumber: string, accessCode: string, id: string) => {
    setPhone(phoneNumber);
    setAccessCode(accessCode);
    setEditingId(id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Telefonnummer löschen möchten?')) {
      deletePhoneNumber(id);
    }
  };

  const cancelEdit = () => {
    setPhone('');
    setAccessCode('');
    setEditingId(null);
  };

  const phoneNumbersList = Object.values(phoneNumbers);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-medium">
            {editingId ? 'Telefonnummer bearbeiten' : 'Neue Telefonnummer erstellen'}
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
                {editingId ? 'Aktualisieren' : 'Telefonnummer hinzufügen'}
              </Button>
              {editingId && (
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
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead>Verwendet am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneNumbersList.map((item) => (
                  <TableRow key={item.id} className={item.isUsed ? 'bg-gray-50' : ''}>
                    <TableCell className="font-medium">{item.phone}</TableCell>
                    <TableCell>{item.accessCode}</TableCell>
                    <TableCell>
                      {item.isUsed ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle size={16} />
                          <span>Verwendet</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={16} />
                          <span>Verfügbar</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      {item.usedAt ? item.usedAt.toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(item.phone, item.accessCode, item.id)}
                          disabled={item.isUsed}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={item.isUsed}
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
