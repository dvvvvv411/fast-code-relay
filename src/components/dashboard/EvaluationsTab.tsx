
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Calendar, Trophy, UserCheck } from 'lucide-react';
import { useUserAssignments } from '@/hooks/useUserAssignments';
import { useAuth } from '@/context/AuthContext';

const EvaluationsTab = () => {
  const { user } = useAuth();
  const { data: assignments = [], isLoading } = useUserAssignments(user?.id);

  // Filter evaluated assignments for users with profiles
  const evaluatedAssignments = assignments.filter(assignment => 
    assignment.is_evaluated && assignment.assigned_user_id
  );
  
  // Calculate stats only for assignments with user profiles - using status consistently
  const profileAssignments = assignments.filter(assignment => assignment.assigned_user_id);
  const totalEvaluations = evaluatedAssignments.length;
  const completedAssignments = profileAssignments.filter(assignment => assignment.status === 'completed').length;
  const averageRating = 4.2; // This would be calculated from actual evaluation data

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange"></div>
            <p className="text-gray-500">Lade Bewertungen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bewertungen</p>
                <p className="text-2xl font-bold text-orange">{totalEvaluations}</p>
              </div>
              <Star className="h-8 w-8 text-orange opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abgeschlossen</p>
                <p className="text-2xl font-bold text-green-600">{completedAssignments}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Durchschnitt</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-yellow-600">{averageRating}</p>
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.floor(averageRating)
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange" />
            Bewertungen (Registrierte Mitarbeiter)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evaluatedAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                Noch keine Bewertungen von registrierten Mitarbeitern
              </p>
              <p className="text-sm text-gray-400">
                Bewertungen werden nur von Mitarbeitern mit Benutzerprofilen angezeigt.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluatedAssignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{assignment.auftrag.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600">{assignment.auftrag.anbieter}</p>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Registriert
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Star className="h-3 w-3 mr-1" />
                        Bewertet
                      </Badge>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= 4 // Mock rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Bewertet am: {new Date(assignment.created_at).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      Mitarbeiter: {assignment.worker_first_name} {assignment.worker_last_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationsTab;
