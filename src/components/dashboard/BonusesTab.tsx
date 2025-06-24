
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Euro, Gift, TrendingUp, Clock, CheckCircle, Building } from 'lucide-react';
import { useUserBonuses, useUserBonusStats } from '@/hooks/useUserBonuses';
import { useAuth } from '@/context/AuthContext';

const BonusesTab = () => {
  const { user } = useAuth();
  const { data: bonuses = [], isLoading } = useUserBonuses(user?.id);
  const { data: stats = { totalAmount: 0, paidAmount: 0, pendingAmount: 0, totalCount: 0 } } = useUserBonusStats(user?.id);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange"></div>
            <p className="text-gray-500">Lade Prämien...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ausgezahlt
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Clock className="h-3 w-3 mr-1" />
            Ausstehend
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Storniert
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamtprämien</p>
                <p className="text-2xl font-bold text-orange">{Math.round(stats.totalAmount)} €</p>
                <p className="text-xs text-gray-500">{stats.totalCount} Prämien</p>
              </div>
              <Gift className="h-8 w-8 text-orange opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausgezahlt</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(stats.paidAmount)} €</p>
                <p className="text-xs text-gray-500">Bereits erhalten</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausstehend</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round(stats.pendingAmount)} €</p>
                <p className="text-xs text-gray-500">In Bearbeitung</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bonuses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-orange" />
            Prämienübersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bonuses.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Noch keine Prämien verdient</p>
              <p className="text-sm text-gray-400">
                Schließen Sie Aufträge erfolgreich ab und erhalten Sie Bewertungen, um Prämien zu verdienen.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bonuses.map((bonus) => (
                <div key={bonus.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {bonus.auftrag_assignments.auftrag.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4 text-gray-500" />
                        <p className="text-sm text-gray-600">
                          {bonus.auftrag_assignments.auftrag.anbieter}
                        </p>
                        <span className="text-gray-400">•</span>
                        <p className="text-sm text-gray-600">
                          Nr. {bonus.auftrag_assignments.auftrag.auftragsnummer}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-green-600">
                          {Math.round(bonus.bonus_amount)} €
                        </p>
                        {getStatusBadge(bonus.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      Prämie erhalten am: {new Date(bonus.awarded_at).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center justify-center gap-2">
              <Gift className="h-5 w-5" />
              Wie funktionieren Prämien?
            </h3>
            <p className="text-green-800 text-sm">
              Sie erhalten automatisch Prämien, wenn Sie Aufträge erfolgreich abschließen und diese bewertet werden. 
              Die Prämie wird basierend auf dem jeweiligen Auftrag vergeben. Ausstehende Prämien werden in der Regel 
              innerhalb von 7 Werktagen ausgezahlt.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BonusesTab;
