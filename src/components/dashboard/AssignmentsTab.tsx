
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, Target, TrendingUp, UserCheck, AlertCircle } from 'lucide-react';
import { useUserAssignments } from '@/hooks/useUserAssignments';
import { useAuth } from '@/context/AuthContext';
import UserAssignments from '@/components/UserAssignments';
import { Badge } from '@/components/ui/badge';

const AssignmentsTab = () => {
  const { user } = useAuth();
  const { data: assignments = [], isLoading } = useUserAssignments(user?.id);

  // Calculate stats for all assignments
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(assignment => assignment.status === 'completed').length;
  const underReviewAssignments = assignments.filter(assignment => assignment.status === 'under_review').length;
  const pendingAssignments = assignments.filter(assignment => assignment.status === 'pending').length;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
  
  // Calculate stats for registered users only
  const registeredAssignments = assignments.filter(assignment => assignment.assigned_user_id);
  const registeredCompleted = registeredAssignments.filter(assignment => assignment.status === 'completed').length;
  const registeredUnderReview = registeredAssignments.filter(assignment => assignment.status === 'under_review').length;
  const registeredCompletionRate = registeredAssignments.length > 0 ? Math.round((registeredCompleted / registeredAssignments.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Status-Updates für registrierte Benutzer</h3>
              <p className="text-sm text-blue-700">
                Registrierte Mitarbeiter können jetzt Bewertungen einreichen, die automatisch den Status auf "In Überprüfung" setzen.
                {underReviewAssignments > 0 && (
                  <> {underReviewAssignments} Bewertungen sind derzeit in Überprüfung.</>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-blue-600">{totalAssignments}</p>
                <p className="text-xs text-gray-500">{registeredAssignments.length} registriert</p>
              </div>
              <Target className="h-8 w-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abgeschlossen</p>
                <p className="text-2xl font-bold text-green-600">{completedAssignments}</p>
                <p className="text-xs text-gray-500">{registeredCompleted} registriert</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Überprüfung</p>
                <p className="text-2xl font-bold text-blue-600">{underReviewAssignments}</p>
                <p className="text-xs text-gray-500">{registeredUnderReview} registriert</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Erfolgsquote</p>
                <p className="text-2xl font-bold text-purple-600">{completionRate}%</p>
                <p className="text-xs text-gray-500">{registeredCompletionRate}% registriert</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Badge */}
      {completionRate >= 80 && totalAssignments >= 5 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500 text-white p-2 rounded-full">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800">Top Performance!</h3>
                <p className="text-sm text-yellow-700">
                  Großartige Arbeit! Sie haben eine Erfolgsquote von {completionRate}% erreicht.
                  {registeredAssignments.length > 0 && (
                    <> Registrierte Mitarbeiter: {registeredCompletionRate}%</>
                  )}
                </p>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 ml-auto">
                🏆 Achievement
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignments List */}
      <UserAssignments />
    </div>
  );
};

export default AssignmentsTab;
