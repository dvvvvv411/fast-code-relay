import { useState } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash, Loader, CheckCircle, XCircle, Shuffle, ExternalLink } from 'lucide-react';
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
import { QuickAddDialog } from './QuickAddDialog';

const PhoneNumberManager = () => {
  const { phoneNumbers, createPhoneNumber, updatePhoneNumber, deletePhoneNumber, isLoading } = useSMS();
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Store URLs in local state only (not in database)
  const [phoneNumberUrls, setPhoneNumberUrls] = useState<Record<string, {url: string, domain: string}>>({});

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

  const handleQuickAdd = (phoneNumber: string, accessCode: string, originalUrl: string, domain: string) => {
    createPhoneNumber(phoneNumber, accessCode);
    
    // Store URL info in local state
    setPhoneNumberUrls(prev => ({
      ...prev,
      [phoneNumber]: { url: originalUrl, domain }
    }));
  };

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
      // Find the phone number to remove from URL state
      const phoneNumberToDelete = Object.values(phoneNumbers).find(pn => pn.id === id)?.phone;
      if (phoneNumberToDelete && phoneNumberUrls[phoneNumberToDelete]) {
        setPhoneNumberUrls(prev => {
          const newUrls = { ...prev };
          delete newUrls[phoneNumberToDelete];
          return newUrls;
        });
      }
      
      deletePhoneNumber(id);
    }
  };

  const cancelEdit = () => {
    setPhone('');
    setAccessCode('');
    setEditingId(null);
  };

  const handleOpenUrl = (phone: string) => {
    const urlInfo = phoneNumberUrls[phone];
    if (urlInfo) {
      window.open(urlInfo.url, '_blank');
    }
  };

  const phoneNumbersList = Object.values(phoneNumbers);

  // Group phone numbers by phone number for better display
  const groupedPhoneNumbers = phoneNumbersList.reduce((acc, phoneNumber) => {
    if (!acc[phoneNumber.phone]) {
      acc[phoneNumber.phone] = [];
    }
    acc[phoneNumber.phone].push(phoneNumber);
    return acc;
  }, {} as Record<string, typeof phoneNumbersList>);

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
              <div className="flex space-x-2">
                <Input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="ABC123"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAccessCode(generateAccessCode())}
                  className="px-3"
                  title="Zufälligen Zugangscode generieren"
                >
                  <Shuffle size={16} />
                </Button>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="bg-orange hover:bg-orange-dark">
                <Plus className="mr-1" size={18} />
                {editingId ? 'Aktualisieren' : 'Telefonnummer hinzufügen'}
              </Button>
              <QuickAddDialog 
                onQuickAdd={handleQuickAdd}
                generateAccessCode={generateAccessCode}
              />
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
          <p className="text-sm text-gray-600">
            Sie können dieselbe Telefonnummer mehrmals mit verschiedenen Zugangscodes hinzufügen.
          </p>
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
                  <TableHead>Domain</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead>Verwendet am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedPhoneNumbers).map(([phoneNumber, entries]) => 
                  entries.map((item, index) => {
                    const urlInfo = phoneNumberUrls[item.phone];
                    const isFirstEntry = index === 0;
                    const hasMultipleEntries = entries.length > 1;
                    
                    return (
                      <TableRow key={item.id} className={item.isUsed ? 'bg-gray-50' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {item.phone}
                            {hasMultipleEntries && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {index + 1}/{entries.length}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                            {item.accessCode}
                          </span>
                        </TableCell>
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
                        <TableCell>
                          {urlInfo ? (
                            <span className="text-sm text-gray-600">{urlInfo.domain}</span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{item.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          {item.usedAt ? item.usedAt.toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {urlInfo && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenUrl(item.phone)}
                                title="URL öffnen"
                              >
                                <ExternalLink size={16} />
                              </Button>
                            )}
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneNumberManager;
