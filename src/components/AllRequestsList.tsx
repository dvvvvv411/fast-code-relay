
import { useState } from 'react';
import { useSMS } from '@/context/SMSContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, Clock, MessageSquare, Timer, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AllRequestsList = () => {
  const { requests, activateRequest, isLoading } = useSMS();
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const requestsArray = Object.values(requests).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'activated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sms_sent':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'sms_requested':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'waiting_for_additional_sms':
        return <Timer className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ausstehend</Badge>;
      case 'activated':
        return <Badge variant="default" className="bg-green-500">Aktiviert</Badge>;
      case 'sms_sent':
        return <Badge variant="default" className="bg-blue-500">SMS Gesendet</Badge>;
      case 'sms_requested':
        return <Badge variant="default" className="bg-blue-500">SMS Angefordert</Badge>;
      case 'waiting_for_additional_sms':
        return <Badge variant="default" className="bg-blue-500">Weitere SMS</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Abgeschlossen</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  const handleActivateRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await activateRequest(requestId);
      toast({
        title: "Anfrage aktiviert!",
        description: "Die Anfrage wurde erfolgreich aktiviert.",
      });
    } catch (error) {
      console.error('Error activating request:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Aktivieren der Anfrage.",
        variant: "destructive",
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (requestsArray.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alle Anfragen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Keine Anfragen vorhanden.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Alle Anfragen ({requestsArray.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Telefonnummer</TableHead>
              <TableHead>Zugangscode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SMS Code</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead>Aktualisiert</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requestsArray.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono text-sm">
                  {request.short_id || request.id.slice(0, 8)}
                </TableCell>
                <TableCell className="font-medium">
                  {request.phone || 'N/A'}
                </TableCell>
                <TableCell className="font-mono">
                  {request.accessCode || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    {getStatusBadge(request.status)}
                  </div>
                </TableCell>
                <TableCell>
                  {request.smsCode ? (
                    <span className="font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                      {request.smsCode}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(request.created_at)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(request.updated_at)}
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleActivateRequest(request.id)}
                      disabled={isLoading || processingRequestId === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingRequestId === request.id ? 'Aktiviere...' : 'Aktivieren'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AllRequestsList;
