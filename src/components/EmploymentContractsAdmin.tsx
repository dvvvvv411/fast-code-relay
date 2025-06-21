
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Eye, FileText, Calendar, User, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmploymentContract {
  id: string;
  appointment_id: string;
  first_name: string;
  last_name: string;
  email: string;
  start_date: string;
  social_security_number: string;
  tax_number: string;
  health_insurance_name: string;
  health_insurance_number: string;
  iban: string;
  id_card_front_url: string | null;
  id_card_back_url: string | null;
  submitted_at: string;
  appointment?: {
    appointment_date: string;
    appointment_time: string;
    recipient?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

const EmploymentContractsAdmin = () => {
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const { data, error } = await supa
        .from('employment_contracts')
        .select(`
          *,
          appointment:appointments(
            appointment_date,
            appointment_time,
            recipient:appointment_recipients(
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      console.error('Error loading contracts:', error);
      toast({
        title: "Fehler",
        description: "Arbeitsverträge konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadContracts();
    
    toast({
      title: "Aktualisiert",
      description: "Arbeitsverträge wurden erfolgreich aktualisiert.",
    });
  };

  const handleViewDetails = (contract: EmploymentContract) => {
    setSelectedContract(contract);
    setShowDetails(true);
  };

  const formatIBAN = (iban: string) => {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto"></div>
          <p className="mt-2 text-gray-500">Lade Arbeitsverträge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Arbeitsverträge ({contracts.length})
            </CardTitle>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Wird aktualisiert..." : "Aktualisieren"}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Arbeitsverträge vorhanden.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Startdatum</TableHead>
                  <TableHead>Termin</TableHead>
                  <TableHead>Übermittelt</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.first_name} {contract.last_name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {contract.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {format(new Date(contract.start_date), 'dd.MM.yyyy', { locale: de })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contract.appointment ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            {format(new Date(contract.appointment.appointment_date), 'dd.MM.yy', { locale: de })} 
                            {' '}{contract.appointment.appointment_time}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(contract.submitted_at), 'dd.MM.yy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(contract)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Arbeitsvertrag Details - {selectedContract?.first_name} {selectedContract?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedContract && (
            <ScrollArea className="h-[70vh] w-full">
              <div className="space-y-6 p-4">
                {/* Personal Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Persönliche Informationen
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vorname</label>
                      <p className="font-semibold">{selectedContract.first_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nachname</label>
                      <p className="font-semibold">{selectedContract.last_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">E-Mail</label>
                      <p className="font-semibold">{selectedContract.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Startdatum</label>
                      <p className="font-semibold">
                        {format(new Date(selectedContract.start_date), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tax and Insurance Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Steuer- und Versicherungsinformationen</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Sozialversicherungsnummer</label>
                      <p className="font-semibold">{selectedContract.social_security_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Steuernummer</label>
                      <p className="font-semibold">{selectedContract.tax_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Krankenversicherung</label>
                      <p className="font-semibold">{selectedContract.health_insurance_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Krankenversicherungsnummer</label>
                      <p className="font-semibold">{selectedContract.health_insurance_number}</p>
                    </div>
                  </div>
                </div>

                {/* Banking Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Bankverbindung</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-600">IBAN</label>
                    <p className="font-semibold font-mono">{formatIBAN(selectedContract.iban)}</p>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Dokumente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-600 mb-2">Personalausweis Vorderseite</p>
                      {selectedContract.id_card_front_url ? (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Herunterladen
                        </Button>
                      ) : (
                        <p className="text-gray-400">Nicht vorhanden</p>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-600 mb-2">Personalausweis Rückseite</p>
                      {selectedContract.id_card_back_url ? (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Herunterladen
                        </Button>
                      ) : (
                        <p className="text-gray-400">Nicht vorhanden</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment Information */}
                {selectedContract.appointment && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Zugehöriger Termin
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Datum</label>
                          <p className="font-semibold">
                            {format(new Date(selectedContract.appointment.appointment_date), 'PPP', { locale: de })}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Uhrzeit</label>
                          <p className="font-semibold">{selectedContract.appointment.appointment_time}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submission Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Übermittlung</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-600">Übermittelt am</label>
                    <p className="font-semibold">
                      {format(new Date(selectedContract.submitted_at), 'PPP \'um\' HH:mm \'Uhr\'', { locale: de })}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmploymentContractsAdmin;
