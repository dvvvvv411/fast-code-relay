import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, RefreshCw, Calendar, User, Mail, Phone, CreditCard, Image, AlertCircle, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import AcceptContractDialog from '@/components/contract/AcceptContractDialog';
import EmploymentContractEmailPreviewDialog from '@/components/contract/EmploymentContractEmailPreviewDialog';

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
  iban: string;
  bic?: string;
  marital_status?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  status: string;
  submitted_at: string;
  accepted_at?: string;
  created_at: string;
  appointment?: {
    appointment_date: string;
    appointment_time: string;
    recipient: {
      first_name: string;
      last_name: string;
      email: string;
      phone_note?: string;
    };
  };
}

const EmploymentContractManager = () => {
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [contractToAccept, setContractToAccept] = useState<EmploymentContract | null>(null);
  const [emailPreviewDialogOpen, setEmailPreviewDialogOpen] = useState(false);
  const [contractForEmailPreview, setContractForEmailPreview] = useState<EmploymentContract | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('employment_contracts')
        .select(`
          *,
          appointment:appointments(
            appointment_date,
            appointment_time,
            recipient:appointment_recipients(
              first_name,
              last_name,
              email,
              phone_note
            )
          )
        `)
        .order('created_at', { ascending: false });

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
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Angenommen';
      case 'rejected':
        return 'Abgelehnt';
      case 'pending':
        return 'Ausstehend';
      default:
        return status;
    }
  };

  const handleRejectContract = async (contractId: string) => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('employment_contracts')
        .update({ 
          status: 'rejected',
          accepted_at: null
        })
        .eq('id', contractId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Arbeitsvertrag wurde abgelehnt.",
      });

      loadContracts();
    } catch (error: any) {
      console.error('Error rejecting contract:', error);
      toast({
        title: "Fehler",
        description: "Arbeitsvertrag konnte nicht abgelehnt werden.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptContract = (contract: EmploymentContract) => {
    setContractToAccept(contract);
    setAcceptDialogOpen(true);
  };

  const handleEmailPreview = (contract: EmploymentContract) => {
    setContractForEmailPreview(contract);
    setEmailPreviewDialogOpen(true);
  };

  const confirmAcceptContract = async (startDate: string) => {
    if (!contractToAccept) return;

    try {
      setIsProcessing(true);
      
      console.log('Calling accept-employment-contract function:', {
        contractId: contractToAccept.id,
        startDate
      });

      const { data, error } = await supabase.functions.invoke('accept-employment-contract', {
        body: {
          contractId: contractToAccept.id,
          startDate: startDate
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Edge function response:', data);

      toast({
        title: "Erfolg",
        description: "Arbeitsvertrag wurde angenommen und Benutzerkonto erstellt. Zugangsdaten wurden per E-Mail versendet.",
      });

      setAcceptDialogOpen(false);
      setContractToAccept(null);
      loadContracts();
    } catch (error: any) {
      console.error('Error accepting contract:', error);
      toast({
        title: "Fehler",
        description: "Arbeitsvertrag konnte nicht angenommen werden: " + (error.message || 'Unbekannter Fehler'),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    if (statusFilter === 'all') return true;
    return contract.status === statusFilter;
  });

  const IdCardImagePreview = ({ imageUrl, title }: { imageUrl: string | null; title: string }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    if (!imageUrl) {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Nicht hochgeladen</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3 text-center">{title}</h4>
        {imageError ? (
          <div className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-500">Fehler beim Laden des Bildes</p>
          </div>
        ) : (
          <div className="relative">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-48 object-contain rounded border"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-orange" />
        <span className="ml-2 text-gray-600">Lade Arbeitsverträge...</span>
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
              Arbeitsverträge ({filteredContracts.length})
            </CardTitle>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadContracts}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Aktualisieren
              </Button>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="pending">Ausstehend</SelectItem>
                  <SelectItem value="accepted">Angenommen</SelectItem>
                  <SelectItem value="rejected">Abgelehnt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Startdatum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eingereicht</TableHead>
                <TableHead>Termin</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.first_name} {contract.last_name}
                  </TableCell>
                  <TableCell>{contract.email}</TableCell>
                  <TableCell>
                    {format(new Date(contract.start_date), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn("text-white text-xs", getStatusColor(contract.status))}
                    >
                      {getStatusText(contract.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(contract.submitted_at), 'dd.MM.yy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>
                    {contract.appointment && (
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(contract.appointment.appointment_date), 'dd.MM.yy', { locale: de })}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {contract.appointment.appointment_time}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContract(contract)}
                        title="Details anzeigen"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmailPreview(contract)}
                        title="E-Mail Vorschau"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      
                      {contract.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectContract(contract.id)}
                            disabled={isProcessing}
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Abgelehnt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcceptContract(contract)}
                            disabled={isProcessing}
                            className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Angenommen
                          </Button>
                        </div>
                      )}

                      {contract.status !== 'pending' && (
                        <span className="text-xs text-gray-500 px-2">
                          {contract.status === 'accepted' ? 'Bereits angenommen' : 'Bereits abgelehnt'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredContracts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                {statusFilter === 'all' 
                  ? 'Keine Arbeitsverträge vorhanden'
                  : `Keine Arbeitsverträge mit Status "${getStatusText(statusFilter)}" vorhanden`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Arbeitsvertrag Details - {selectedContract?.first_name} {selectedContract?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedContract && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Persönliche Daten
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Name:</strong> {selectedContract.first_name} {selectedContract.last_name}</div>
                    <div><strong>E-Mail:</strong> {selectedContract.email}</div>
                    <div><strong>Startdatum:</strong> {format(new Date(selectedContract.start_date), 'dd.MM.yyyy', { locale: de })}</div>
                    {selectedContract.marital_status && (
                      <div><strong>Familienstand:</strong> {selectedContract.marital_status}</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Steuerliche Daten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Sozialversicherungsnummer:</strong> {selectedContract.social_security_number}</div>
                    <div><strong>Steuernummer:</strong> {selectedContract.tax_number}</div>
                    <div><strong>Krankenkasse:</strong> {selectedContract.health_insurance_name}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Banking Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bankdaten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>IBAN:</strong> {selectedContract.iban}</div>
                  {selectedContract.bic && (
                    <div><strong>BIC:</strong> {selectedContract.bic}</div>
                  )}
                </CardContent>
              </Card>

              {/* ID Card Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Personalausweis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <IdCardImagePreview 
                      imageUrl={selectedContract.id_card_front_url} 
                      title="Vorderseite" 
                    />
                    <IdCardImagePreview 
                      imageUrl={selectedContract.id_card_back_url} 
                      title="Rückseite" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Information */}
              {selectedContract.appointment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Zugehöriger Termin
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Datum:</strong> {format(new Date(selectedContract.appointment.appointment_date), 'dd.MM.yyyy', { locale: de })}</div>
                    <div><strong>Uhrzeit:</strong> {selectedContract.appointment.appointment_time}</div>
                    <div><strong>Bewerber:</strong> {selectedContract.appointment.recipient.first_name} {selectedContract.appointment.recipient.last_name}</div>
                    <div><strong>E-Mail:</strong> {selectedContract.appointment.recipient.email}</div>
                    {selectedContract.appointment.recipient.phone_note && (
                      <div><strong>Telefon:</strong> {selectedContract.appointment.recipient.phone_note}</div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Status Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>Aktueller Status:</strong>
                    <Badge 
                      variant="outline" 
                      className={cn("text-white", getStatusColor(selectedContract.status))}
                    >
                      {getStatusText(selectedContract.status)}
                    </Badge>
                  </div>
                  <div><strong>Eingereicht am:</strong> {format(new Date(selectedContract.submitted_at), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
                  {selectedContract.accepted_at && (
                    <div><strong>Angenommen am:</strong> {format(new Date(selectedContract.accepted_at), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
        </DialogContent>
      </Dialog>

      {/* Accept Contract Dialog */}
      {contractToAccept && (
        <AcceptContractDialog
          isOpen={acceptDialogOpen}
          onClose={() => {
            setAcceptDialogOpen(false);
            setContractToAccept(null);
          }}
          onConfirm={confirmAcceptContract}
          contractData={{
            first_name: contractToAccept.first_name,
            last_name: contractToAccept.last_name,
            email: contractToAccept.email,
            start_date: contractToAccept.start_date
          }}
          isLoading={isProcessing}
        />
      )}

      {/* Email Preview Dialog */}
      <EmploymentContractEmailPreviewDialog
        isOpen={emailPreviewDialogOpen}
        onClose={() => {
          setEmailPreviewDialogOpen(false);
          setContractForEmailPreview(null);
        }}
        contract={contractForEmailPreview}
      />
    </div>
  );
};

export default EmploymentContractManager;
