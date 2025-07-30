import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  session: Session | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    session: null
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      if (!supabase) {
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          session: null
        });
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
            session: null
          });
          return;
        }

        setAuthState({
          user: session?.user ?? null,
          loading: false,
          isAuthenticated: !!session?.user,
          session
        });
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          session: null
        });
      }
    };

    getInitialSession();

    if (!supabase) return;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'No user');
        
        setAuthState({
          user: session?.user ?? null,
          loading: false,
          isAuthenticated: !!session?.user,
          session
        });

        // Create user preferences on first sign up
        if (event === 'SIGNED_IN' && session?.user) {
          await createUserPreferences(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const createUserPreferences = async (user: User) => {
    if (!supabase) return;
    
    try {
      // Check if preferences already exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        // Create default preferences
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            theme: 'system',
            dashboard_layout: 'default',
            default_view: 'calendar',
            ai_provider: 'gemini',
            ai_model: 'gemini-pro',
            ai_enabled: true,
            work_start_time: '09:00:00',
            work_end_time: '17:00:00',
            work_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            break_duration: 15,
            task_duration_default: 60,
            energy_schedule: '{}'
          });

        if (error) {
          console.error('Error creating user preferences:', error);
        } else {
          console.log('✅ Created default user preferences');
        }
      }
    } catch (error) {
      console.error('Error in createUserPreferences:', error);
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not available' };
    }

    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: error.message };
      }

      // Note: User will receive email confirmation
      console.log('✅ Sign up successful - check email for confirmation');
      setAuthState(prev => ({ ...prev, loading: false }));
      
      return { 
        success: true, 
        error: data.user && !data.session ? 'Please check your email to confirm your account.' : undefined
      };
    } catch (error) {
      console.error('Sign up exception:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false, error: 'An unexpected error occurred during sign up.' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not available' };
    }

    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: error.message };
      }

      if (!data.user) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'No user returned from sign in.' };
      }

      console.log('✅ Sign in successful:', data.user.email);
      // Auth state will be updated by the onAuthStateChange listener
      return { success: true };
    } catch (error) {
      console.error('Sign in exception:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false, error: 'An unexpected error occurred during sign in.' };
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not available' };
    }

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Sign out successful');
      // Auth state will be updated by the onAuthStateChange listener
      return { success: true };
    } catch (error) {
      console.error('Sign out exception:', error);
      return { success: false, error: 'An unexpected error occurred during sign out.' };
    }
  };

  const value: AuthContextType = {
    ...authState,
    signIn,
    signOut,
    signUp
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export default SupabaseAuthProvider;