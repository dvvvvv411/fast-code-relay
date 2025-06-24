
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
  
  const waitForAdminStatus = async (maxWaitTime = 3000): Promise<boolean> => {
    const startTime = Date.now();
    const pollInterval = 100;
    
    return new Promise((resolve) => {
      const checkAdminStatus = () => {
        const elapsed = Date.now() - startTime;
        
        console.log(`🔍 Polling admin status - Elapsed: ${elapsed}ms, Loading: ${auth.isLoading}, Admin: ${auth.isAdmin}, User: ${auth.user?.email}`);
        
        // If we're no longer loading, we have our final status
        if (!auth.isLoading && auth.user) {
          console.log(`✅ Admin status resolved - Admin: ${auth.isAdmin} for ${auth.user.email}`);
          resolve(auth.isAdmin);
          return;
        }
        
        // If we've exceeded max wait time, resolve with current status
        if (elapsed >= maxWaitTime) {
          console.log(`⏰ Admin status check timeout - Using current status: ${auth.isAdmin}`);
          resolve(auth.isAdmin);
          return;
        }
        
        // Continue polling
        setTimeout(checkAdminStatus, pollInterval);
      };
      
      checkAdminStatus();
    });
  };
  
  const signInAndRedirect = async (email: string, password: string) => {
    console.log('🔐 Starting signInAndRedirect for:', email);
    const result = await auth.signIn(email, password);
    
    if (result.success) {
      console.log('✅ Sign in successful, waiting for admin status to resolve');
      console.log('🔍 Initial auth status - User:', auth.user?.email, 'IsAdmin:', auth.isAdmin, 'IsLoading:', auth.isLoading);
      
      try {
        // Wait for admin status to be fully resolved
        const isAdminUser = await waitForAdminStatus();
        
        console.log(`🎯 Final redirect decision - IsAdmin: ${isAdminUser} for user: ${auth.user?.email}`);
        
        if (isAdminUser) {
          console.log('👑 Redirecting admin user to /admin');
          navigate('/admin');
        } else {
          console.log('👤 Redirecting regular user to /dashboard');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('❌ Error waiting for admin status:', error);
        // Fallback to dashboard if there's an error
        console.log('🔄 Fallback: redirecting to /dashboard');
        navigate('/dashboard');
      }
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
