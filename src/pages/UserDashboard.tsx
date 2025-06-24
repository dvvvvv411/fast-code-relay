import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader, LogOut, BarChart3, User, Star, Target } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import PersonalDataTab from '@/components/dashboard/PersonalDataTab';
import EvaluationsTab from '@/components/dashboard/EvaluationsTab';
import AssignmentsTab from '@/components/dashboard/AssignmentsTab';
import { useEffect } from 'react';

const UserDashboard = () => {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  
  // Enhanced logging for debugging user dashboard access
  useEffect(() => {
    console.log('🏠 Dashboard - Auth state:', {
      user: user?.email || 'none',
      isLoading,
      isAdmin,
      timestamp: new Date().toISOString()
    });
  }, [user, isLoading, isAdmin]);
  
  const handleSignOut = async () => {
    console.log('🚪 User signing out from dashboard');
    await signOut();
  };
  
  // Show loading while authentication state is being determined
  if (isLoading) {
    console.log('⏳ Dashboard - Still loading auth state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-orange mx-auto mb-4" />
          <p className="text-gray-500">Lade...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to auth if no user
  if (!user) {
    console.log('🚫 Dashboard - No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Allow both regular users AND admins to access the dashboard
  console.log('✅ Dashboard - Access granted for user:', user.email, '(Admin status:', isAdmin, ')');
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-orange text-white p-2 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              Kontrollzentrum
            </h1>
            <p className="text-gray-600 mt-2">
              Verwalten Sie Ihre Tests, sehen Sie Ihre Fortschritte und optimieren Sie Ihre Performance
            </p>
            {isAdmin && (
              <p className="text-sm text-orange-600 mt-1 font-medium">
                👑 Admin-Benutzer - Sie haben auch Zugriff auf den <a href="/admin" className="underline">Admin-Bereich</a>
              </p>
            )}
          </div>
          <Button 
            variant="outline"
            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-2/3 mx-auto bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-orange data-[state=active]:text-white transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Übersicht</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assignments"
              className="flex items-center gap-2 data-[state=active]:bg-orange data-[state=active]:text-white transition-all"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Aufgaben</span>
            </TabsTrigger>
            <TabsTrigger 
              value="evaluations" 
              className="flex items-center gap-2 data-[state=active]:bg-orange data-[state=active]:text-white transition-all"
            >
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Bewertungen</span>
            </TabsTrigger>
            <TabsTrigger 
              value="personal" 
              className="flex items-center gap-2 data-[state=active]:bg-orange data-[state=active]:text-white transition-all"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Persönliche Daten</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardSummary />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <AssignmentsTab />
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-6">
            <EvaluationsTab />
          </TabsContent>

          <TabsContent value="personal" className="space-y-6">
            <PersonalDataTab />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default UserDashboard;
