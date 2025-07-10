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

// Predefined credentials for bypass authentication - PRODUCTION LOCKED
const BYPASS_CREDENTIALS = [
  { email: 'justclay63@gmail.com', password: 't4mhozd25q' },
  { email: 'test@ultron.com', password: 'ultron123' },
  { email: 'admin@ultron.com', password: 'admin123' }
];

// Production security: Only allow predefined emails
const PRODUCTION_MODE = true; // Set to false for open registration

// Generate a consistent UUID for user ID based on email
// Since database user_id is UUID type, we need to generate proper UUIDs
const generateUserId = (email: string): string => {
  // Simple hash function to generate consistent IDs
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to proper UUID v4 format (8-4-4-4-12) that will be accepted as UUID by PostgreSQL
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
  
  // Create additional deterministic hex from email
  let emailHash = 0;
  for (let i = 0; i < email.length; i++) {
    emailHash = ((emailHash << 3) - emailHash) + email.charCodeAt(i);
    emailHash = emailHash & emailHash;
  }
  const emailHex = Math.abs(emailHash).toString(16).padStart(8, '0');
  
  // Generate UUID parts ensuring proper format for PostgreSQL UUID type
  const part1 = hashHex; // 8 chars
  const part2 = hashHex.slice(0, 4); // 4 chars
  const part3 = '4' + hashHex.slice(1, 4); // 4 chars (version 4)
  const part4 = '8' + emailHex.slice(1, 4); // 4 chars (variant 8-b)
  const part5 = emailHex + hashHex.slice(0, 4); // 12 chars
  
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
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
        return { success: false, error: 'Invalid credentials' };
      }

      // Create user object
      const user: User = {
        id: generateUserId(email),
        email: email.toLowerCase(),
        created_at: new Date().toISOString()
      };

      // Create user in database if it doesn't exist (optional - fallback to localStorage if it fails)
      if (supabase) {
        try {
          // First try to create user in custom users table
          const { error } = await supabase
            .from('users')
            .upsert([{
              id: user.id,
              email: user.email,
              created_at: user.created_at
            }], { onConflict: 'id' });
          
          if (error) {
            console.error('❌ Database user creation failed:', error);
            
            // If table doesn't exist (42P01) or access denied (42501), try alternative approach
            if (error.code === '42P01' || error.code === '42501') {
              console.log('🔄 Custom users table not accessible, using auth.users reference instead');
              // The user_preferences table should reference auth.users directly
              // We'll rely on Supabase auth for user management
            } else {
              console.warn('Could not create user in database:', error.message);
            }
          } else {
            console.log('✅ User upsert completed, verifying...');
            
            // Verify the user was actually created by querying it back
            const { data: verifyData, error: verifyError } = await supabase
              .from('users')
              .select('id, email')
              .eq('id', user.id)
              .single();
            
            if (verifyError || !verifyData) {
              console.error('❌ User verification failed after creation:', verifyError?.message || 'User not found');
              console.warn('User was not successfully created in database despite no error');
            } else {
              console.log('✅ User verified in database:', verifyData);
              console.log('✅ User successfully verified in database');
              // Longer delay to ensure the user record is fully committed to the database
              // This prevents foreign key constraint violations when creating user preferences
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (dbError: any) {
          console.error('❌ Database user creation exception:', dbError);
          console.warn('Database user creation failed, continuing with localStorage:', dbError?.message || dbError);
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
        return { success: false, error: 'Password must be at least 8 characters' };
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
      // In a real app, this would go to a database
      BYPASS_CREDENTIALS.push({ email: email.toLowerCase(), password });

      // Create user object
      const user: User = {
        id: generateUserId(email),
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Sign out error:', errorMessage);
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