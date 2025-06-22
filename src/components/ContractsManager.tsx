
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Eye, Check, X, Loader2, Calendar, Mail, User, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EmploymentContract {
  id: string;
  appointment_id: string;
  first_name: string;
  last_name: string;
  email: string;
  start_date: string;
  iban: string;
  bic: string | null;
  social_security_number: string;
  tax_number: string;
  health_insurance_name: string;
  marital_status: string | null;
  status: string;
  submitted_at: string;
  accepted_at: string | null;
}

const ContractsManager = () => {
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContracts = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('employment_contracts')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: "Fehler",
        description: "Verträge konnten nicht geladen werden.",
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

  const handleStatusUpdate = async (contractId: string, newStatus: string) => {
    setUpdatingStatus(contractId);
    
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('employment_contracts')
        .update(updateData)
        .eq('id', contractId);

      if (error) throw error;

      // Update local state
      setContracts(prev => prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, status: newStatus, accepted_at: newStatus === 'accepted' ? new Date().toISOString() : contract.accepted_at }
          : contract
      ));

      toast({
        title: "Status aktualisiert",
        description: `Vertragsstatus wurde auf "${getStatusText(newStatus)}" geändert.`,
      });
    } catch (error) {
      console.error('Error updating contract status:', error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
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
        return 'Unbekannt';
    }
  };

  const filteredContracts = contracts.filter(contract => {
    if (statusFilter === 'all') return true;
    return contract.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange" />
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
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchContracts(false)}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Lädt..." : "Aktualisieren"}
              </Button>
              
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
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
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id} className="hover:bg-gray-50">
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
                    <div className="flex items-center gap-1">
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
                            onClick={() => handleStatusUpdate(contract.id, 'accepted')}
                            disabled={updatingStatus === contract.id}
                            className="hover:bg-green-100 hover:text-green-600"
                            title="Annehmen"
                          >
                            {updatingStatus === contract.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(contract.id, 'rejected')}
                            disabled={updatingStatus === contract.id}
                            className="hover:bg-red-100 hover:text-red-600"
                            title="Ablehnen"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Arbeitsvertrag Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedContract && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Persönliche Daten</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <p>{selectedContract.first_name} {selectedContract.last_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">E-Mail:</span>
                    <p>{selectedContract.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Startdatum:</span>
                    <p>{format(new Date(selectedContract.start_date), 'dd.MM.yyyy', { locale: de })}</p>
                  </div>
                  {selectedContract.marital_status && (
                    <div>
                      <span className="font-medium text-gray-600">Familienstand:</span>
                      <p>{selectedContract.marital_status}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Banking Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Bankverbindung</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">IBAN:</span>
                    <p className="font-mono">{selectedContract.iban}</p>
                  </div>
                  {selectedContract.bic && (
                    <div>
                      <span className="font-medium text-gray-600">BIC:</span>
                      <p className="font-mono">{selectedContract.bic}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tax and Insurance Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Steuer- und Versicherungsdaten</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Sozialversicherungsnummer:</span>
                    <p className="font-mono">{selectedContract.social_security_number}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Steuernummer:</span>
                    <p className="font-mono">{selectedContract.tax_number}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Krankenkasse:</span>
                    <p>{selectedContract.health_insurance_name}</p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant="outline" 
                    className={cn("text-white", getStatusColor(selectedContract.status))}
                  >
                    {getStatusText(selectedContract.status)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Eingereicht: {format(new Date(selectedContract.submitted_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </span>
                  {selectedContract.accepted_at && (
                    <span className="text-sm text-gray-500">
                      Angenommen: {format(new Date(selectedContract.accepted_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedContract.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleStatusUpdate(selectedContract.id, 'accepted')}
                    disabled={updatingStatus === selectedContract.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updatingStatus === selectedContract.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Annehmen
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdate(selectedContract.id, 'rejected')}
                    disabled={updatingStatus === selectedContract.id}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Ablehnen
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsManager;
