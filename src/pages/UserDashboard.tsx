
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, LogOut, User, Calendar, FileText } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UserAssignments from '@/components/UserAssignments';

const UserDashboard = () => {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-orange mx-auto mb-4" />
          <p className="text-gray-500">Lade...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect admins to admin panel
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Mitarbeiter-Dashboard</h1>
            <p className="text-gray-600">Willkommen, {user.user_metadata?.first_name || user.email}!</p>
          </div>
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>

        <div className="space-y-8">
          {/* User Assignments Section */}
          <UserAssignments />

          {/* Overview Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profil</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Persönliche Daten</div>
                <p className="text-xs text-muted-foreground">
                  Verwalten Sie Ihre persönlichen Informationen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aufgaben</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Heute</div>
                <p className="text-xs text-muted-foreground">
                  Ihre täglichen Aufgaben und Termine
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dokumente</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Verfügbar</div>
                <p className="text-xs text-muted-foreground">
                  Wichtige Dokumente und Formulare
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Schnellzugriff</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Ab Ihrem ersten Arbeitstag werden hier Ihre täglichen Aufgaben und wichtige Informationen angezeigt.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Willkommen im Team!</h3>
                  <p className="text-blue-800 text-sm">
                    Wir freuen uns, Sie als neuen Mitarbeiter begrüßen zu dürfen. 
                    Weitere Funktionen werden Ihnen nach Ihrem Startdatum zur Verfügung stehen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserDashboard;
