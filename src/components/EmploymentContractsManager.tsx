
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  User, 
  Mail, 
  Calendar, 
  Eye, 
  Search,
  RefreshCw,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface EmploymentContract {
  id: string;
  appointment_id: string;
  first_name: string;
  last_name: string;
  email: string;
  social_security_number: string;
  tax_number: string;
  health_insurance_name: string;
  iban: string;
  bic?: string;
  marital_status?: string;
  start_date: string;
  status: string;
  submitted_at: string;
  accepted_at?: string;
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

const EmploymentContractsManager = () => {
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setIsLoading(true);
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { label: 'Ausstehend', variant: 'secondary' as const },
      'accepted': { label: 'Akzeptiert', variant: 'default' as const },
      'rejected': { label: 'Abgelehnt', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredContracts = contracts.filter(contract =>
    contract.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedContract) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setSelectedContract(null)}
            >
              ← Zurück zur Übersicht
            </Button>
            <h2 className="text-2xl font-bold">Arbeitsvertrag Details</h2>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(selectedContract.status)}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Persönliche Daten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">Name</Label>
                <p className="text-sm">{selectedContract.first_name} {selectedContract.last_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">E-Mail</Label>
                <p className="text-sm">{selectedContract.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Familienstand</Label>
                <p className="text-sm">{selectedContract.marital_status || 'Nicht angegeben'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Gewünschtes Startdatum</Label>
                <p className="text-sm">{new Date(selectedContract.start_date).toLocaleDateString('de-DE')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tax and Insurance */}
          <Card>
            <CardHeader>
              <CardTitle>Steuer- und Versicherungsdaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">Sozialversicherungsnummer</Label>
                <p className="text-sm font-mono">{selectedContract.social_security_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Steuernummer</Label>
                <p className="text-sm font-mono">{selectedContract.tax_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Krankenkasse</Label>
                <p className="text-sm">{selectedContract.health_insurance_name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Banking Information */}
          <Card>
            <CardHeader>
              <CardTitle>Bankdaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">IBAN</Label>
                <p className="text-sm font-mono">{selectedContract.iban}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">BIC</Label>
                <p className="text-sm font-mono">{selectedContract.bic || 'Nicht angegeben'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Information */}
          {selectedContract.appointment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Termin-Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Termindatum</Label>
                  <p className="text-sm">
                    {new Date(selectedContract.appointment.appointment_date).toLocaleDateString('de-DE')} um {selectedContract.appointment.appointment_time.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Eingereicht am</Label>
                  <p className="text-sm">{formatDate(selectedContract.submitted_at)}</p>
                </div>
                {selectedContract.accepted_at && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Akzeptiert am</Label>
                    <p className="text-sm">{formatDate(selectedContract.accepted_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Arbeitsverträge</h2>
        <Button
          variant="outline"
          onClick={loadContracts}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Aktualisieren
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Nach Name oder E-Mail suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{contracts.length}</div>
            <p className="text-sm text-gray-600">Gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{contracts.filter(c => c.status === 'pending').length}</div>
            <p className="text-sm text-gray-600">Ausstehend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{contracts.filter(c => c.status === 'accepted').length}</div>
            <p className="text-sm text-gray-600">Akzeptiert</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-orange mx-auto mb-4" />
            <p className="text-gray-500">Lade Arbeitsverträge...</p>
          </div>
        </div>
      ) : filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchTerm ? 'Keine Arbeitsverträge gefunden.' : 'Noch keine Arbeitsverträge eingereicht.'}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-orange" />
                    <div>
                      <h3 className="font-medium">
                        {contract.first_name} {contract.last_name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contract.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Eingereicht: {formatDate(contract.submitted_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(contract.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedContract(contract)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmploymentContractsManager;
