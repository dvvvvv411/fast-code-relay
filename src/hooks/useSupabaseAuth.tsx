
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 Auth state change:', event, newSession?.user?.email);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Reset admin status immediately when session changes
        if (!newSession?.user) {
          console.log('🚫 No user - setting admin to false');
          setIsAdmin(false);
          setIsLoading(false);
        } else {
          console.log('👤 User found - checking admin status');
          setIsLoading(true);
          // Use setTimeout to avoid potential deadlock with onAuthStateChange
          setTimeout(() => {
            checkIfAdmin(newSession.user.id);
          }, 0);
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        console.log('🔍 Initializing auth...');
        setIsLoading(true);
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        console.log('📋 Current session:', currentSession?.user?.email || 'none');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await checkIfAdmin(currentSession.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        toast({
          title: "Authentifizierungsfehler",
          description: "Es gab ein Problem mit der Anmeldung.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    initializeAuth();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkIfAdmin = async (userId: string) => {
    try {
      console.log('🔍 Checking admin status for user ID:', userId);
      
      const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
      
      if (error) {
        console.error('❌ Error calling is_admin RPC:', error);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      console.log('📊 RPC is_admin raw response:', data, 'Type:', typeof data);
      
      const adminStatus = Boolean(data);
      console.log('✅ Admin check result for', userId, ':', adminStatus);
      
      console.log(`🎯 Setting admin status to: ${adminStatus} for user: ${userId}`);
      setIsAdmin(adminStatus);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Exception checking admin status:', error);
      setIsAdmin(false);
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting sign in for:', email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      console.log('✅ Sign in successful for:', email);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error signing in:', error);
      return { 
        success: false, 
        error: error.message || 'Ein Fehler ist bei der Anmeldung aufgetreten.'
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      toast({
        title: "Registrierung erfolgreich",
        description: "Bitte bestätigen Sie Ihre E-Mail-Adresse.",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { 
        success: false, 
        error: error.message || 'Ein Fehler ist bei der Registrierung aufgetreten.'
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      return { success: true };
    } catch (error: any) {
      console.error('Error signing out:', error);
      return { 
        success: false, 
        error: error.message || 'Ein Fehler ist beim Abmelden aufgetreten.'
      };
    }
  };

  return {
    user,
    session,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
  };
};
