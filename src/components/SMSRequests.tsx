
import { useSMS } from '@/context/SMSContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  Loader, 
  RefreshCw,
  Timer,
  ExternalLink
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const SMSRequests = () => {
  const { requests, isLoading } = useSMS();
  const requestsArray = Object.values(requests);

  // Sort requests by creation date (newest first)
  const sortedRequests = requestsArray.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Ausstehend',
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />,
          description: 'Wartet auf Aktivierung'
        };
      case 'activated':
        return {
          label: 'Aktiviert',
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />,
          description: 'Nummer aktiviert, wartet auf SMS'
        };
      case 'sms_requested':
        return {
          label: 'SMS angefordert',
          variant: 'outline' as const,
          icon: <RefreshCw className="h-4 w-4" />,
          description: 'SMS wurde angefordert'
        };
      case 'sms_sent':
        return {
          label: 'SMS gesendet',
          variant: 'outline' as const,
          icon: <Loader className="h-4 w-4" />,
          description: 'SMS wurde gesendet, wartet auf Code'
        };
      case 'waiting_for_additional_sms':
        return {
          label: 'Code empfangen',
          variant: 'default' as const,
          icon: <Timer className="h-4 w-4" />,
          description: 'Code empfangen, kann weitere SMS anfordern'
        };
      case 'completed':
        return {
          label: 'Abgeschlossen',
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />,
          description: 'Erfolgreich abgeschlossen'
        };
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />,
          description: 'Unbekannter Status'
        };
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Aktivierungs-Anfragen
          </CardTitle>
          <p className="text-sm text-gray-600">
            Übersicht aller Anfragen zur Nummer-Aktivierung und SMS-Code-Empfang
          </p>
        </CardHeader>
        <CardContent>
          {sortedRequests.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Keine SMS-Anfragen vorhanden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kurz-ID</TableHead>
                  <TableHead>Telefonnummer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SMS Code</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead>Aktualisiert</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRequests.map((request) => {
                  const statusInfo = getStatusInfo(request.status);
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                          {request.shortId}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {request.phone}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {statusInfo.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        {request.smsCode ? (
                          <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            {request.smsCode}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDateTime(request.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDateTime(request.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`/?request=${request.id}`, '_blank')}
                          title="Anfrage in neuem Tab öffnen"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSRequests;
