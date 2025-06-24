
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  signInAndRedirect: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  signUp: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  signOut: () => Promise<{
    success: boolean;
    error?: string;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useSupabaseAuth();
  const navigate = useNavigate();
  
  // Handle redirect after authentication state is fully determined
  useEffect(() => {
    // Only redirect when we have a user and loading is complete
    if (auth.user && !auth.isLoading) {
      console.log('🚀 Auth redirect check - User:', auth.user.email, 'IsAdmin:', auth.isAdmin, 'IsLoading:', auth.isLoading);
      
      // Small delay to ensure all state updates are complete
      const timer = setTimeout(() => {
        if (auth.isAdmin) {
          console.log('👑 Redirecting admin to /admin');
          navigate('/admin');
        } else {
          console.log('👤 Redirecting user to /dashboard');
          navigate('/dashboard');
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [auth.user, auth.isAdmin, auth.isLoading, navigate]);
  
  const signInAndRedirect = async (email: string, password: string) => {
    console.log('🔐 Starting signInAndRedirect for:', email);
    const result = await auth.signIn(email, password);
    
    if (result.success) {
      console.log('✅ Sign in successful, redirect will be handled by useEffect');
    } else {
      console.log('❌ Sign in failed:', result.error);
    }
    
    return result;
  };
  
  return (
    <AuthContext.Provider value={{
      ...auth,
      signInAndRedirect
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
