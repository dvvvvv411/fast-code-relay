
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Clock, CheckCircle, Star, User } from 'lucide-react';
import { useUserAssignments } from '@/hooks/useUserAssignments';
import { useAuth } from '@/context/AuthContext';

const UserAssignments = () => {
  const { user } = useAuth();
  const { data: assignments = [], isLoading, error } = useUserAssignments(user?.id);

  const handleViewAssignment = (assignmentUrl: string) => {
    window.open(`/assignment/${assignmentUrl}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange"></div>
            <p className="text-gray-500">Lade Ihre Aufträge...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-500">Fehler beim Laden der Aufträge.</p>
          <p className="text-sm text-gray-500 mt-2">
            Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            Keine Aufträge gefunden
          </p>
          <p className="text-sm text-gray-400">
            Ihnen wurden noch keine Aufträge zugewiesen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Ihre zugewiesenen Aufträge</h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {assignments.length} {assignments.length === 1 ? 'Auftrag' : 'Aufträge'}
        </Badge>
      </div>
      
      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg text-gray-900">{assignment.auftrag.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600">
                      {assignment.auftrag.anbieter}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm font-mono text-gray-500">
                      {assignment.auftrag.auftragsnummer}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {assignment.is_completed ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Abgeschlossen
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      In Bearbeitung
                    </Badge>
                  )}
                  {assignment.is_evaluated && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Star className="h-3 w-3 mr-1" />
                      Bewertet
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Projektziel:</strong> {assignment.auftrag.projektziel.substring(0, 200)}
                    {assignment.auftrag.projektziel.length > 200 && '...'}
                  </p>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    Zugewiesen am: {new Date(assignment.created_at).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span>
                    Worker: {assignment.worker_first_name} {assignment.worker_last_name}
                  </span>
                </div>
                
                <div className="flex justify-end pt-2 border-t">
                  <Button
                    size="sm"
                    onClick={() => handleViewAssignment(assignment.assignment_url)}
                    className="bg-orange hover:bg-orange-dark text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Auftrag anzeigen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserAssignments;
