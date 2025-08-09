import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { securityMonitor } from '../services/securityMonitor';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const CustomAuthContext = createContext<AuthContextType | undefined>(undefined);

export const CustomAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false
  });

  // Initialize auth state and set up listener
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (!supabase) {
          console.error('Supabase not configured');
          if (mounted) {
            setAuthState({
              user: null,
              loading: false,
              isAuthenticated: false
            });
          }
          return;
        }

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setAuthState({
              user: null,
              loading: false,
              isAuthenticated: false
            });
          }
          return;
        }

        if (session?.user && mounted) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || new Date().toISOString()
          };
          
          setAuthState({
            user,
            loading: false,
            isAuthenticated: true
          });
          
          // Update localStorage for compatibility
          localStorage.setItem('ultron_custom_user', JSON.stringify(user));
          localStorage.setItem('ultron_session_expiry', (Date.now() + (24 * 60 * 60 * 1000)).toString());
        } else if (mounted) {
          // Clear localStorage if no session
          localStorage.removeItem('ultron_custom_user');
          localStorage.removeItem('ultron_session_expiry');
          
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false
          });
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (!mounted) return;

      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || new Date().toISOString()
        };
        
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true
        });
        
        // Update localStorage for compatibility
        localStorage.setItem('ultron_custom_user', JSON.stringify(user));
        localStorage.setItem('ultron_session_expiry', (Date.now() + (24 * 60 * 60 * 1000)).toString());
      } else {
        // Clear localStorage when session is null
        localStorage.removeItem('ultron_custom_user');
        localStorage.removeItem('ultron_session_expiry');
        
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false
        });
      }
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      if (!supabase) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'Supabase not configured' };
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        securityMonitor.logUnauthorizedLogin(email);
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: error.message || 'Invalid credentials' };
      }

      // Auth state will be updated by the onAuthStateChange listener
      // Just return success, don't manually update state here
      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false, error: error?.message || 'An error occurred during sign in' };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      if (!supabase) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          // Set email confirmation to false for development/testing
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        securityMonitor.logUnauthorizedSignup(email);
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: error.message || 'Signup failed' };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return { 
          success: false, 
          error: 'Please check your email to confirm your account before signing in.' 
        };
      }

      // Auth state will be updated by the onAuthStateChange listener
      // Just return success, don't manually update state here
      return { success: true };
    } catch (error: any) {
      console.error('Sign up error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false, error: error?.message || 'An error occurred during sign up' };
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      if (!supabase) {
        // Clear localStorage if Supabase not available
        localStorage.removeItem('ultron_custom_user');
        localStorage.removeItem('ultron_session_expiry');
        
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false
        });
        return;
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
      }
      
      // Auth state will be updated by the onAuthStateChange listener
      // But also clear localStorage immediately for consistency
      localStorage.removeItem('ultron_custom_user');
      localStorage.removeItem('ultron_session_expiry');
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear state on error
      localStorage.removeItem('ultron_custom_user');
      localStorage.removeItem('ultron_session_expiry');
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false
      });
    }
  };

  return (
    <CustomAuthContext.Provider value={{
      ...authState,
      signIn,
      signOut,
      signUp
    }}>
      {children}
    </CustomAuthContext.Provider>
  );
};

export const useCustomAuth = (): AuthContextType => {
  const context = useContext(CustomAuthContext);
  if (context === undefined) {
    throw new Error('useCustomAuth must be used within a CustomAuthProvider');
  }
  return context;
};

// Helper function to get current user for database operations
export const getCustomAuthUser = async (): Promise<User | null> => {
  try {
    // First check if we have a valid Supabase session
    if (supabase) {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!error && session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || new Date().toISOString()
        };
        
        // Update localStorage for consistency
        localStorage.setItem('ultron_custom_user', JSON.stringify(user));
        localStorage.setItem('ultron_session_expiry', (Date.now() + (24 * 60 * 60 * 1000)).toString());
        
        return user;
      }
    }
    
    // Fallback to localStorage check (for backwards compatibility)
    const storedUser = localStorage.getItem('ultron_custom_user');
    const sessionExpiry = localStorage.getItem('ultron_session_expiry');
    
    if (storedUser && sessionExpiry) {
      const expiryTime = parseInt(sessionExpiry);
      const currentTime = Date.now();
      
      if (currentTime < expiryTime) {
        return JSON.parse(storedUser);
      } else {
        // Session expired, clear it
        localStorage.removeItem('ultron_custom_user');
        localStorage.removeItem('ultron_session_expiry');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting custom auth user:', error);
    return null;
  }
};