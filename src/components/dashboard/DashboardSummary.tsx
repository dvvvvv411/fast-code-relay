
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Star, Target, TrendingUp, Calendar, Award } from 'lucide-react';
import { useUserAssignments } from '@/hooks/useUserAssignments';
import { useAuth } from '@/context/AuthContext';

const DashboardSummary = () => {
  const { user } = useAuth();
  const { data: assignments = [], isLoading } = useUserAssignments(user?.id);

  // Calculate stats
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(assignment => assignment.is_completed).length;
  const evaluatedAssignments = assignments.filter(assignment => assignment.is_evaluated).length;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Determine user level based on completed assignments
  const getUserLevel = (completed: number) => {
    if (completed >= 20) return { level: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (completed >= 10) return { level: 'Profi', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (completed >= 5) return { level: 'Fortgeschritten', color: 'text-green-600', bg: 'bg-green-100' };
    return { level: 'Einsteiger', color: 'text-orange', bg: 'bg-orange-100' };
  };

  const userLevel = getUserLevel(completedAssignments);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange"></div>
            <p className="text-gray-500">Lade Dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange text-white p-2 rounded-full">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Willkommen zurück, {user?.user_metadata?.first_name || 'Tester'}!
                </h2>
                <p className="text-gray-600 text-sm">Ihr App-Testing Dashboard</p>
              </div>
            </div>
            <Badge className={`${userLevel.bg} ${userLevel.color} border-0`}>
              <Award className="h-3 w-3 mr-1" />
              {userLevel.level}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aufträge gesamt</p>
                <p className="text-2xl font-bold text-blue-600">{totalAssignments}</p>
                <p className="text-xs text-gray-500">Alle zugewiesenen Tests</p>
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
                <p className="text-xs text-gray-500">Erfolgreich getestet</p>
              </div>
              <div className="relative">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">{completionRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bewertungen</p>
                <p className="text-2xl font-bold text-yellow-600">{evaluatedAssignments}</p>
                <p className="text-xs text-gray-500">Feedback erhalten</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600 opacity-80 fill-current" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Streak</p>
                <p className="text-2xl font-bold text-orange">7</p>
                <p className="text-xs text-gray-500">Tage aktiv</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange" />
            Letzte Aktivitäten
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Noch keine Aktivitäten</p>
              <p className="text-sm text-gray-400">
                Ihre ersten Aufträge werden hier angezeigt.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 3).map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      assignment.is_completed ? 'bg-green-500' : 'bg-orange animate-pulse'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{assignment.auftrag.title}</p>
                      <p className="text-sm text-gray-600">{assignment.auftrag.anbieter}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.is_completed && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Abgeschlossen
                      </Badge>
                    )}
                    {assignment.is_evaluated && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Bewertet
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {assignments.length > 3 && (
                <p className="text-center text-sm text-gray-500 pt-2">
                  und {assignments.length - 3} weitere Aufträge...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivational Message */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="font-semibold text-blue-900 mb-2">
              {completedAssignments === 0 
                ? "Bereit für Ihren ersten Test?" 
                : completionRate >= 80 
                ? "Fantastische Arbeit!" 
                : "Weiter so!"}
            </h3>
            <p className="text-blue-800 text-sm">
              {completedAssignments === 0 
                ? "Erkunden Sie die verfügbaren Aufträge im Aufgaben-Tab und starten Sie Ihre erste App-Testing Session."
                : completionRate >= 80 
                ? `Mit einer Erfolgsquote von ${completionRate}% gehören Sie zu unseren Top-Testern! Machen Sie weiter so.`
                : `Sie haben bereits ${completedAssignments} Aufträge abgeschlossen. Jeder Test hilft, Apps zu verbessern!`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
