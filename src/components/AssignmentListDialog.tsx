
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Users, Calendar, Edit } from 'lucide-react';
import EditAssignmentDialog from './EditAssignmentDialog';

interface Assignment {
  id: string;
  worker_first_name: string;
  worker_last_name: string;
  assignment_url: string;
  is_completed: boolean;
  created_at: string;
}

interface AssignmentListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  auftragId: string;
  auftragTitle: string;
}

const AssignmentListDialog = ({ isOpen, onClose, auftragId, auftragTitle }: AssignmentListDialogProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && auftragId) {
      fetchAssignments();
    }
  }, [isOpen, auftragId]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('auftrag_assignments')
        .select('*')
        .eq('auftrag_id', auftragId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Fehler",
        description: "Zuweisungen konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyLinkToClipboard = async (assignmentUrl: string, workerName: string) => {
    const fullUrl = `${window.location.origin}/assignment/${assignmentUrl}`;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Link kopiert",
        description: `Assignment-Link für ${workerName} wurde in die Zwischenablage kopiert.`
      });
    } catch (error) {
      // Fallback for browsers without clipboard support
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Link kopiert",
        description: `Assignment-Link für ${workerName} wurde kopiert.`
      });
    }
  };

  const handleEditAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setEditDialogOpen(true);
  };

  const handleAssignmentUpdated = () => {
    fetchAssignments();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Zuweisungen für: {auftragTitle}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="text-gray-500">Lade Zuweisungen...</div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            Noch keine Zuweisungen für diesen Auftrag.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {assignments.length} Zuweisung{assignments.length !== 1 ? 'en' : ''} gefunden
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead>Assignment-Link</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.worker_first_name} {assignment.worker_last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.is_completed ? "default" : "secondary"}>
                        {assignment.is_completed ? "Abgeschlossen" : "Aktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(assignment.created_at).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLinkToClipboard(
                          assignment.assignment_url, 
                          `${assignment.worker_first_name} ${assignment.worker_last_name}`
                        )}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-4 w-4" />
                        Link kopieren
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAssignment(assignment.id)}
                        className="flex items-center gap-1 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                      >
                        <Edit className="h-4 w-4" />
                        Bearbeiten
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>

        {selectedAssignmentId && (
          <EditAssignmentDialog
            isOpen={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            assignmentId={selectedAssignmentId}
            onAssignmentUpdated={handleAssignmentUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentListDialog;
