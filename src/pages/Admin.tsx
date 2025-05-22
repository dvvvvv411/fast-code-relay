
import Header from '@/components/Header';
import AdminPanel from '@/components/AdminPanel';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader, LogOut } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";

const Admin = () => {
  const { user, isLoading, signOut } = useAuth();
  
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
