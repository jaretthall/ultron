import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, debugUsersTable } from '../../lib/supabaseClient';
import { securityMonitor } from '../services/securityMonitor';

interface User {
  id: string; // UUID
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

// Predefined credentials for bypass authentication - PRODUCTION LOCKED
const BYPASS_CREDENTIALS = [
  { email: 'justclay63@gmail.com', password: 't4mhozd25q' },
  { email: 'test@ultron.com', password: 'ultron123' },
  { email: 'admin@ultron.com', password: 'admin123' }
];

// Production security: Only allow predefined emails
const PRODUCTION_MODE = true; // Set to false for open registration

// Generate a proper UUID v4 for user ID based on email (deterministic)
const generateUserId = (email: string): string => {
  // Create a deterministic seed from email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash as a seed for deterministic UUID generation
  const rng = () => {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };

  // Generate RFC 4122 v4 UUID deterministically
  const chars = '0123456789abcdef';
  let uuid = '';
  
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4'; // Version 4
    } else if (i === 19) {
      uuid += chars[(Math.floor(rng() * 4) + 8)]; // Variant bits
    } else {
      uuid += chars[Math.floor(rng() * 16)];
    }
  }
  
  return uuid;
};

export const CustomAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const storedUser = localStorage.getItem('ultron_custom_user');
        const sessionExpiry = localStorage.getItem('ultron_session_expiry');
        
        if (storedUser && sessionExpiry) {
          const expiryTime = parseInt(sessionExpiry);
          const currentTime = Date.now();
          
          if (currentTime < expiryTime) {
            // Session is still valid
            const user = JSON.parse(storedUser);
            setAuthState({
              user,
              loading: false,
              isAuthenticated: true
            });
            return;
          } else {
            // Session expired, clear it
            localStorage.removeItem('ultron_custom_user');
            localStorage.removeItem('ultron_session_expiry');
          }
        }
        
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false
        });
      } catch (error) {
        console.error('Error checking existing session:', error);
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false
        });
      }
    };

    checkExistingSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      // Check if credentials match our bypass list
      const validCredential = BYPASS_CREDENTIALS.find(
        cred => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
      );

      if (!validCredential) {
        // Log unauthorized login attempt
        securityMonitor.logUnauthorizedLogin(email);
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate deterministic UUID for this user
      const userId = generateUserId(email);

      // Create user object
      const user: User = {
        id: userId,
        email: email.toLowerCase(),
        created_at: new Date().toISOString()
      };

      // Create user in the clean database
      if (supabase) {
        try {
          console.log('🔄 Creating user in clean database schema...');
          
          // Use upsert to handle existing users gracefully
          const { error: upsertError } = await supabase
            .from('users')
            .upsert([{
              id: user.id,
              email: user.email,
              created_at: user.created_at,
              auth_type: 'custom',
              last_login: new Date().toISOString(),
              is_active: true
            }], { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });
          
          if (upsertError) {
            console.error('❌ Database user upsert failed:', upsertError);
            console.warn('Continuing with localStorage auth despite database error');
          } else {
            console.log('✅ User successfully created/updated in database');
            
            // Verify the user was created
            const { data: verifyData, error: verifyError } = await supabase
              .from('users')
              .select('id, email, auth_type')
              .eq('id', user.id)
              .single();
            
            if (verifyError) {
              console.error('❌ User verification failed:', verifyError);
            } else {
              console.log('✅ User verified in database:', verifyData);
            }
          }
        } catch (dbError: any) {
          console.error('❌ Database operation exception:', dbError);
          console.warn('Continuing with localStorage auth despite database error');
        }
      }

      // Set session expiry (24 hours)
      const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
      
      // Store in localStorage
      localStorage.setItem('ultron_custom_user', JSON.stringify(user));
      localStorage.setItem('ultron_session_expiry', sessionExpiry.toString());

      setAuthState({
        user,
        loading: false,
        isAuthenticated: true
      });

      console.log('✅ Custom auth sign-in completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false, error: 'An error occurred during sign in' };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      // PRODUCTION SECURITY: Block unauthorized registration
      if (PRODUCTION_MODE) {
        // Only allow signup for predefined emails
        const isAllowedEmail = BYPASS_CREDENTIALS.some(
          cred => cred.email.toLowerCase() === email.toLowerCase()
        );
        
        if (!isAllowedEmail) {
          // Log unauthorized attempt
          securityMonitor.logUnauthorizedSignup(email);
          setAuthState(prev => ({ ...prev, loading: false }));
          return { success: false, error: 'Account registration is currently restricted. Contact administrator.' };
        }
      }

      // For bypass mode, we'll allow any new email but require a minimum password length
      if (password.length < 8) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'Password must be at least 8 characters long' };
      }

      // Check if email is already "registered" (in our bypass list)
      const existingUser = BYPASS_CREDENTIALS.find(
        cred => cred.email.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'Email already registered. Please sign in instead.' };
      }

      // In production mode, don't actually add new users
      if (PRODUCTION_MODE) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'Account registration is currently restricted.' };
      }

      // For demo purposes, we'll add the new user to our bypass list temporarily
      BYPASS_CREDENTIALS.push({ email: email.toLowerCase(), password });

      // Generate deterministic UUID for this user
      const userId = generateUserId(email);

      // Create user object
      const user: User = {
        id: userId,
        email: email.toLowerCase(),
        created_at: new Date().toISOString()
      };

      // Set session expiry (24 hours)
      const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
      
      // Store in localStorage
      localStorage.setItem('ultron_custom_user', JSON.stringify(user));
      localStorage.setItem('ultron_session_expiry', sessionExpiry.toString());

      setAuthState({
        user,
        loading: false,
        isAuthenticated: true
      });

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false, error: 'An error occurred during sign up' };
    }
  };

  const signOut = () => {
    try {
      // Update last logout in database if possible
      if (supabase && authState.user) {
        supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', authState.user.id)
          .then(() => console.log('✅ User logout timestamp updated'))
          .catch(error => console.warn('Could not update logout timestamp:', error));
      }

      // Clear localStorage
      localStorage.removeItem('ultron_custom_user');
      localStorage.removeItem('ultron_session_expiry');
      
      // Also try to sign out from Supabase if it's available (to be safe)
      if (supabase) {
        supabase.auth.signOut().catch(console.error);
      }

      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false
      });

      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
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
export const getCustomAuthUser = (): User | null => {
  try {
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