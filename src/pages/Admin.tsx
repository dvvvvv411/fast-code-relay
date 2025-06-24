
import Header from '@/components/Header';
import AdminPanel from '@/components/AdminPanel';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader, LogOut, Shield } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from 'react';
import { useSMS } from '@/context/SMSContext';

const Admin = () => {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const { requests } = useSMS();
  
  // Enhanced logging for debugging admin access
  useEffect(() => {
    console.log('🔍 Admin page - Auth state:', {
      user: user?.email || 'none',
      isLoading,
      isAdmin,
      timestamp: new Date().toISOString()
    });
  }, [user, isLoading, isAdmin]);
  
  // Log requests data whenever it changes to debug the status updates
  useEffect(() => {
    console.log('🔄 Admin page - Requests updated:', Object.values(requests).length, 'total requests');
    Object.values(requests).forEach(request => {
      console.log(`📊 Admin view - Request ${request.id}: ${request.status} - Phone: ${request.phone}`);
    });
  }, [requests]);
  
  const handleSignOut = async () => {
    console.log('🚪 Admin signing out');
    await signOut();
  };
  
  // Show loading while authentication state is being determined
  if (isLoading) {
    console.log('⏳ Admin page - Still loading auth state');
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
    console.log('🚫 Admin page - No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Enhanced admin check with additional security logging
  if (!isAdmin) {
    console.log('🚫 Admin page access denied for user:', user.email);
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
  
  console.log('✅ Admin page - Access granted for:', user.email);
  
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
