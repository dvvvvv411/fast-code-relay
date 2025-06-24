
import { createContext, useContext, ReactNode } from 'react';
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
  
  const signInAndRedirect = async (email: string, password: string) => {
    console.log('🔐 Starting signInAndRedirect for:', email);
    const result = await auth.signIn(email, password);
    
    if (result.success) {
      console.log('✅ Sign in successful, checking admin status for redirect');
      console.log('🔍 Auth status - User:', auth.user?.email, 'IsAdmin:', auth.isAdmin, 'IsLoading:', auth.isLoading);
      
      // Wait a moment for auth state to settle, then redirect based on admin status
      setTimeout(() => {
        if (auth.isAdmin) {
          console.log('👑 Redirecting admin to /admin');
          navigate('/admin');
        } else {
          console.log('👤 Redirecting user to /dashboard');
          navigate('/dashboard');
        }
      }, 100);
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
