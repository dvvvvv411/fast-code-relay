
import Header from '@/components/Header';
import AdminPanel from '@/components/AdminPanel';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader, LogOut, Shield } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";

const Admin = () => {
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

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-6">
            Sie haben keine Berechtigung, den Admin-Bereich zu betreten. Diese Seite ist nur für Administratoren zugänglich.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
            <p className="text-sm text-gray-500">
              Als regulärer Benutzer angemeldet: {user.email}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin-Bereich</h1>
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>
        <AdminPanel />
      </div>
      <Toaster />
    </div>
  );
};

export default Admin;
