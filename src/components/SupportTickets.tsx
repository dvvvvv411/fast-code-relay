
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SupportTicket {
  id: string;
  phone: string;
  issue: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Date;
}

const SupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
    
    // Set up real-time subscription
    const ticketsChannel = supabase
      .channel('public:support_tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        () => {
          // Refetch all tickets when any change happens
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedTickets = data.map(ticket => ({
        id: ticket.id,
        phone: ticket.phone,
        issue: ticket.issue,
        description: ticket.description,
        status: ticket.status as 'open' | 'in_progress' | 'resolved',
        createdAt: new Date(ticket.created_at)
      }));
      
      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast({
        title: "Fehler",
        description: "Die Support Tickets konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: 'open' | 'in_progress' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      toast({
        title: "Status aktualisiert",
        description: "Der Ticket-Status wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Fehler",
        description: "Der Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'resolved':
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Offen';
      case 'in_progress':
        return 'In Bearbeitung';
      case 'resolved':
        return 'Gelöst';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
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
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-medium">Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Keine Support Tickets vorhanden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefonnummer</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.phone}</TableCell>
                    <TableCell>{ticket.issue}</TableCell>
                    <TableCell>{ticket.description || '-'}</TableCell>
                    <TableCell>{ticket.createdAt.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span>{getStatusText(ticket.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        defaultValue={ticket.status}
                        onValueChange={(value) => updateTicketStatus(
                          ticket.id, 
                          value as 'open' | 'in_progress' | 'resolved'
                        )}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Status ändern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Offen</SelectItem>
                          <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                          <SelectItem value="resolved">Gelöst</SelectItem>
                        </SelectContent>
                      </Select>
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

export default SupportTickets;
