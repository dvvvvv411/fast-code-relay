import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { FileText, User, Mail, Calendar, Clock, Download, Eye, RefreshCw, X, Check, UserPlus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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
  marital_status: string | null;
  iban: string;
  bic: string | null;
  id_card_front_url: string | null;
  id_card_back_url: string | null;
  submitted_at: string;
  created_at: string;
  status: string;
  accepted_at: string | null;
  user_id: string | null;
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

const EmploymentContractManager = () => {
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; filename: string; title: string } | null>(null);
  const { toast } = useToast();

  const fetchContracts = async () => {
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
              email
            )
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching employment contracts:', error);
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

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchContracts();
  };

  const handleAcceptContract = async (contractId: string) => {
    setIsProcessing(contractId);
    
    try {
      console.log('🚀 Accepting contract:', contractId);
      
      const { data, error } = await supabase.functions.invoke('accept-employment-contract', {
        body: { contractId }
      });

      if (error) {
        console.error('❌ Function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Unbekannter Fehler beim Akzeptieren des Vertrags');
      }

      console.log('✅ Contract accepted successfully');

      toast({
        title: "Vertrag akzeptiert!",
        description: data.message || "Der Arbeitsvertrag wurde erfolgreich akzeptiert und eine E-Mail wurde versendet.",
      });

      // Refresh the contracts list
      await fetchContracts();
      
      // Update selected contract if it's the one we just processed
      if (selectedContract?.id === contractId) {
        const updatedContract = contracts.find(c => c.id === contractId);
        if (updatedContract) {
          setSelectedContract({ ...updatedContract, status: 'accepted', accepted_at: new Date().toISOString() });
        }
      }

    } catch (error: any) {
      console.error('❌ Error accepting contract:', error);
      toast({
        title: "Fehler",
        description: error.message || "Beim Akzeptieren des Vertrags ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectContract = async (contractId: string) => {
    setIsProcessing(contractId);
    
    try {
      const { error } = await supabase
        .from('employment_contracts')
        .update({
          status: 'rejected',
        })
        .eq('id', contractId);

      if (error) throw error;

      toast({
        title: "Vertrag abgelehnt",
        description: "Der Arbeitsvertrag wurde abgelehnt.",
      });

      // Refresh the contracts list
      await fetchContracts();
      
      // Update selected contract if it's the one we just processed
      if (selectedContract?.id === contractId) {
        setSelectedContract({ ...selectedContract, status: 'rejected' });
      }

    } catch (error: any) {
      console.error('Error rejecting contract:', error);
      toast({
        title: "Fehler",
        description: "Beim Ablehnen des Vertrags ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('employment-documents')
        .download(url);

      if (error) throw error;

      // Create download link
      const blob = new Blob([data]);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Fehler",
        description: "Datei konnte nicht heruntergeladen werden.",
        variant: "destructive",
      });
    }
  };

  const handlePreviewImage = async (url: string, filename: string, title: string) => {
    try {
      const { data } = await supabase.storage
        .from('employment-documents')
        .getPublicUrl(url);
      
      setImagePreview({
        url: data.publicUrl,
        filename,
        title
      });
    } catch (error) {
      console.error('Error loading image preview:', error);
      toast({
        title: "Fehler",
        description: "Bildvorschau konnte nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ausstehend</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-500">Akzeptiert</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Arbeitsverträge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Lade Arbeitsverträge...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedContract) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Arbeitsvertrag Details
                {getStatusBadge(selectedContract.status)}
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedContract.status === 'pending' && (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="default" 
                          className="bg-green-600 hover:bg-green-700"
                          disabled={isProcessing === selectedContract.id}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Akzeptieren
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Vertrag akzeptieren</AlertDialogTitle>
                          <AlertDialogDescription>
                            Möchten Sie den Arbeitsvertrag von {selectedContract.first_name} {selectedContract.last_name} wirklich akzeptieren?
                            <br /><br />
                            Dies wird:
                            <ul className="list-disc ml-6 mt-2">
                              <li>Ein Benutzerkonto erstellen (falls noch nicht vorhanden)</li>
                              <li>Eine Willkommens-E-Mail mit Anmeldedaten senden</li>
                              <li>Den Vertragsstatus auf "Akzeptiert" setzen</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleAcceptContract(selectedContract.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Akzeptieren & Konto erstellen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive"
                          disabled={isProcessing === selectedContract.id}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Ablehnen
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Vertrag ablehnen</AlertDialogTitle>
                          <AlertDialogDescription>
                            Möchten Sie den Arbeitsvertrag von {selectedContract.first_name} {selectedContract.last_name} wirklich ablehnen?
                            Diese Aktion kann nicht rückgängig gemacht werden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleRejectContract(selectedContract.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Ablehnen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedContract(null)}
                >
                  Zurück zur Übersicht
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Information */}
            {selectedContract.status !== 'pending' && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Status-Information</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(selectedContract.status)}
                  </div>
                  {selectedContract.accepted_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Akzeptiert am:</span>
                      <span>{format(new Date(selectedContract.accepted_at), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr</span>
                    </div>
                  )}
                  {selectedContract.user_id && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Benutzer-ID:</span>
                      <span className="font-mono text-sm">{selectedContract.user_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Persönliche Daten</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Name:</span>
                    <span>{selectedContract.first_name} {selectedContract.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">E-Mail:</span>
                    <span>{selectedContract.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Startdatum:</span>
                    <span>{format(new Date(selectedContract.start_date), 'dd.MM.yyyy', { locale: de })}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Termin-Information</h3>
                {selectedContract.appointment && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Termin:</span>
                      <span>
                        {format(new Date(selectedContract.appointment.appointment_date), 'dd.MM.yyyy', { locale: de })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Uhrzeit:</span>
                      <span>{selectedContract.appointment.appointment_time}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Beschäftigungsdaten</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Sozialversicherungsnummer:</span>
                    <span className="ml-2">{selectedContract.social_security_number}</span>
                  </div>
                  <div>
                    <span className="font-medium">Steuer-ID:</span>
                    <span className="ml-2">{selectedContract.tax_number}</span>
                  </div>
                  <div>
                    <span className="font-medium">IBAN:</span>
                    <span className="ml-2">{selectedContract.iban}</span>
                  </div>
                  {selectedContract.bic && (
                    <div>
                      <span className="font-medium">BIC:</span>
                      <span className="ml-2">{selectedContract.bic}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Krankenkasse:</span>
                    <span className="ml-2">{selectedContract.health_insurance_name}</span>
                  </div>
                  <div>
                    <span className="font-medium">Familienstand:</span>
                    <span className="ml-2">{selectedContract.marital_status || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Dokumente</h3>
              <div className="flex gap-4">
                {selectedContract.id_card_front_url && (
                  <Button
                    variant="outline"
                    onClick={() => handlePreviewImage(
                      selectedContract.id_card_front_url!, 
                      `${selectedContract.first_name}_${selectedContract.last_name}_Ausweis_Vorderseite.jpg`,
                      'Ausweis Vorderseite'
                    )}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ausweis Vorderseite
                  </Button>
                )}
                {selectedContract.id_card_back_url && (
                  <Button
                    variant="outline"
                    onClick={() => handlePreviewImage(
                      selectedContract.id_card_back_url!, 
                      `${selectedContract.first_name}_${selectedContract.last_name}_Ausweis_Rueckseite.jpg`,
                      'Ausweis Rückseite'
                    )}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ausweis Rückseite
                  </Button>
                )}
              </div>
            </div>

            {/* Submission Info */}
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Eingereicht am:</span>
                <span className="ml-2">
                  {format(new Date(selectedContract.submitted_at), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Preview Dialog */}
        <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="max-w-4xl w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{imagePreview?.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImagePreview(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            {imagePreview && (
              <div className="space-y-4">
                <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                  <img
                    src={imagePreview.url}
                    alt={imagePreview.title}
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-sm"
                  />
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      if (selectedContract && imagePreview.title === 'Ausweis Vorderseite') {
                        handleDownloadFile(selectedContract.id_card_front_url!, imagePreview.filename);
                      } else if (selectedContract && imagePreview.title === 'Ausweis Rückseite') {
                        handleDownloadFile(selectedContract.id_card_back_url!, imagePreview.filename);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Herunterladen
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Arbeitsverträge ({contracts.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Lädt..." : "Aktualisieren"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Arbeitsverträge vorhanden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Startdatum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Termin</TableHead>
                  <TableHead>Eingereicht</TableHead>
                  <TableHead>Dokumente</TableHead>
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
                      {format(new Date(contract.start_date), 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(contract.status)}
                    </TableCell>
                    <TableCell>
                      {contract.appointment ? (
                        <div className="text-sm">
                          <div>{format(new Date(contract.appointment.appointment_date), 'dd.MM.yyyy', { locale: de })}</div>
                          <div className="text-gray-500">{contract.appointment.appointment_time}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(contract.submitted_at), 'dd.MM.yy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {contract.id_card_front_url && (
                          <Badge variant="outline" className="text-xs">
                            Vorderseite
                          </Badge>
                        )}
                        {contract.id_card_back_url && (
                          <Badge variant="outline" className="text-xs">
                            Rückseite
                          </Badge>
                        )}
                        {!contract.id_card_front_url && !contract.id_card_back_url && (
                          <Badge variant="secondary" className="text-xs">
                            Keine
                          </Badge>
                        )}
                      </div>
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
                        {contract.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAcceptContract(contract.id)}
                              disabled={isProcessing === contract.id}
                              title="Vertrag akzeptieren"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {isProcessing === contract.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectContract(contract.id)}
                              disabled={isProcessing === contract.id}
                              title="Vertrag ablehnen"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{imagePreview?.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImagePreview(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <div className="space-y-4">
              <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                <img
                  src={imagePreview.url}
                  alt={imagePreview.title}
                  className="max-w-full max-h-96 object-contain rounded-lg shadow-sm"
                />
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    if (selectedContract && imagePreview.title === 'Ausweis Vorderseite') {
                      handleDownloadFile(selectedContract.id_card_front_url!, imagePreview.filename);
                    } else if (selectedContract && imagePreview.title === 'Ausweis Rückseite') {
                      handleDownloadFile(selectedContract.id_card_back_url!, imagePreview.filename);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Herunterladen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmploymentContractManager;
