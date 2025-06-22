
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Clock, CheckCircle, Star } from 'lucide-react';
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
          <p className="text-gray-500">Lade Ihre Aufträge...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-500">Fehler beim Laden der Aufträge.</p>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">
            Ihnen wurden noch keine Aufträge zugewiesen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Ihre zugewiesenen Aufträge</h3>
      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg">{assignment.auftrag.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {assignment.auftrag.anbieter} • {assignment.auftrag.auftragsnummer}
                  </p>
                </div>
                <div className="flex gap-2">
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
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  <strong>Projektziel:</strong> {assignment.auftrag.projektziel.substring(0, 150)}
                  {assignment.auftrag.projektziel.length > 150 && '...'}
                </p>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    Zugewiesen am: {new Date(assignment.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleViewAssignment(assignment.assignment_url)}
                    className="bg-orange hover:bg-orange-dark"
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
