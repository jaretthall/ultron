import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Project, Task, UserPreferences, Tag, TagCategory, Note, Schedule, DocumentFile, Plan
} from '../types'; // Path should be correct if types.ts is in src/

// Supabase configuration - Support beta environment
const isBetaMode = import.meta.env.VITE_BETA_MODE === 'true';
const supabaseUrl = isBetaMode 
  ? import.meta.env.VITE_SUPABASE_URL_BETA || import.meta.env.VITE_SUPABASE_URL
  : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = isBetaMode
  ? import.meta.env.VITE_SUPABASE_ANON_KEY_BETA || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  : import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Check if we're on Vercel or similar IPv4-only platform
const isIPv4OnlyPlatform = () => {
  return !!(process.env.VERCEL || process.env.RENDER || process.env.GITHUB_ACTIONS);
};

const SUPABASE_URL_PLACEHOLDER = 'YOUR_SUPABASE_URL_PLACEHOLDER';
const SUPABASE_ANON_KEY_PLACEHOLDER = 'YOUR_SUPABASE_ANON_KEY_PLACEHOLDER';

let supabaseSingleton: SupabaseClient<Database> | null = null;

export const isSupabaseConfigured = (): boolean => {
  const urlValid = Boolean(supabaseUrl && 
                   supabaseUrl !== SUPABASE_URL_PLACEHOLDER && 
                   supabaseUrl.startsWith('https://') && 
                   supabaseUrl.includes('.supabase.co'));
  
  const keyValid = Boolean(supabaseAnonKey && 
                   supabaseAnonKey !== SUPABASE_ANON_KEY_PLACEHOLDER &&
                   supabaseAnonKey.length > 30 &&
                   (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_'))); // Support both JWT and publishable key formats
  
  return urlValid && keyValid;
};

// Initialize Supabase client with better error handling
const initializeSupabase = () => {
  console.log('🔍 Initializing Supabase client...');
  console.log('- Beta Mode:', isBetaMode);
  console.log('- Raw URL:', supabaseUrl);
  console.log('- Raw Key:', supabaseAnonKey);
  console.log('- URL type:', typeof supabaseUrl);
  console.log('- Key type:', typeof supabaseAnonKey);
  console.log('- URL length:', supabaseUrl?.length || 0);
  console.log('- Key length:', supabaseAnonKey?.length || 0);
  console.log('- URL valid:', supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL_PLACEHOLDER' && supabaseUrl.startsWith('https://'));
  console.log('- Key valid:', supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_PLACEHOLDER' && supabaseAnonKey.length > 30);
  
  // Additional debug for Vercel environment
  console.log('🌐 Environment Debug:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    isIPv4OnlyPlatform: isIPv4OnlyPlatform(),
    keyType: supabaseAnonKey?.startsWith('eyJ') ? 'JWT (anon)' : supabaseAnonKey?.startsWith('sb_') ? 'Publishable' : 'Unknown',
    allEnvKeys: Object.keys(import.meta.env).filter(key => key.includes('SUPABASE'))
  });
  
  if (!isSupabaseConfigured()) {
    console.error(
      "❌ Supabase configuration FAILED:",
      "\n- URL:", supabaseUrl,
      "\n- URL type:", typeof supabaseUrl,
      "\n- Key type:", typeof supabaseAnonKey,
      "\n- Key length:", supabaseAnonKey?.length || 0,
      "\n⚠️ Cannot create Supabase client with invalid credentials"
    );
    return null;
  }

  // Double-check values before passing to createClient
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase URL or Key is null/undefined, cannot create client');
    return null;
  }

  try {
    console.log('🔧 Creating Supabase client with valid credentials...');
    const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000)
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      },
      db: {
        schema: 'public'
      }
    });

    console.log('✅ Supabase client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error);
    console.error('❌ URL that caused error:', supabaseUrl);
    console.error('❌ Key that caused error:', supabaseAnonKey?.substring(0, 20) + '...');
    return null;
  }
};

supabaseSingleton = initializeSupabase();

export const supabase = supabaseSingleton;

// Export a function to test the connection
export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  console.log('🔗 Client config:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey?.length || 0,
    clientReady: !!supabase,
    isIPv4Platform: isIPv4OnlyPlatform()
  });
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return false;
  }

  try {
    console.log('🔐 Testing auth session...');
    // Test auth connection
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 Session test result:', { 
      hasSession: !!sessionData?.session,
      sessionError: sessionError?.message || null,
      user: sessionData?.session?.user?.email || 'No user'
    });
    
    console.log('📊 Testing database connection...');
    // Test database connection by trying to read from projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1);
    
    console.log('📊 Database test result:', { 
      projectsCount: projects?.length || 0, 
      errorCode: projectsError?.code || null,
      errorMessage: projectsError?.message || null,
      errorDetails: projectsError?.details || null,
      errorHint: projectsError?.hint || null,
      projects: projects 
    });
    
    if (projectsError) {
      console.error('❌ Database connection failed with error:', {
        code: projectsError.code,
        message: projectsError.message,
        details: projectsError.details,
        hint: projectsError.hint
      });
      
      // Check for specific IPv4 compatibility errors
      if (projectsError.code === '406' || projectsError.code === '400' || 
          projectsError.message?.includes('406') || projectsError.message?.includes('400')) {
        console.error('🚨 IPv4 compatibility error detected!');
        console.error('💡 This is likely due to Vercel being IPv4-only');
        console.error('💡 Consider using Supabase Session Pooler for IPv4 compatibility');
        console.error('💡 Or contact Supabase support about IPv4 support for your project');
      }
      
      return false;
    }
    
    console.log('✅ Supabase connection test successful');
    console.log(`📊 Found ${projects?.length || 0} projects in database`);
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed with exception:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Check for network-level errors that might indicate IPv4 issues
    if (error instanceof Error && (error.message.includes('Failed to fetch') || 
        error.message.includes('Network request failed'))) {
      console.error('🚨 Network connectivity issue detected!');
      console.error('💡 This might be related to IPv4/IPv6 compatibility');
      console.error('💡 Consider using Supabase Session Pooler for IPv4 compatibility');
    }
    
    return false;
  }
};

// Helper function to clear all auth state (for JWT errors)
export const clearAuthState = () => {
  try {
    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('🧹 Cleared all auth state');
    return true;
  } catch (error) {
    console.error('Failed to clear auth state:', error);
    return false;
  }
};

// Helper function to diagnose JWT issues
export const diagnoseJWTIssue = async () => {
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  console.log('🔍 Diagnosing JWT issue...');
  
  // Check current session
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', sessionData);
    if (sessionError) {
      console.error('Session error:', sessionError);
      
      // If JWT error, suggest clearing auth state
      if (sessionError.message.includes('JWT') || sessionError.message.includes('invalid')) {
        console.log('💡 Suggestion: Clear auth state and re-authenticate');
        console.log('Run: clearAuthState() then refresh and login again');
      }
    }
  } catch (error) {
    console.error('Failed to get session:', error);
  }

  // Check localStorage tokens
  const authKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-'))) {
      authKeys.push(key);
    }
  }
  console.log('Auth keys in localStorage:', authKeys);
};

// Debug function to check users table contents
export const debugUsersTable = async () => {
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return;
  }

  try {
    console.log('🔍 Debugging users table...');
    
    // Try to count all users
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting users:', countError);
    } else {
      console.log(`📊 Total users in table: ${count}`);
    }
    
    // Try to get all users (limit 10 for safety)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log('👥 Users in database:', users);
    }
    
  } catch (error) {
    console.error('❌ Exception while debugging users table:', error);
  }
};

// Helper to create Insert types, typically omitting id and auto-generated fields like created_at/updated_at
// For universal sync fields, they might be set by client or server, making them optional on insert.
type BaseInsert<T extends { id: string; created_at?: string; updated_at?: string }> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
type BaseUpdate<T> = Partial<T>;

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project; // Project type already uses snake_case
        Insert: BaseInsert<Project>;
        Update: BaseUpdate<Project>;
      };
      tasks: {
        Row: Task; // Task type already uses snake_case
        Insert: BaseInsert<Task>;
        Update: BaseUpdate<Task>;
      };
      user_preferences: {
        Row: UserPreferences; // UserPreferences type already uses snake_case
        Insert: Omit<UserPreferences, 'id'>;
        Update: BaseUpdate<UserPreferences>;
      };
      tags: {
        Row: Tag; // Tag type already uses snake_case
        Insert: BaseInsert<Tag>;
        Update: BaseUpdate<Tag>;
      };
      tag_categories: {
        Row: TagCategory; // TagCategory type already uses snake_case
        Insert: BaseInsert<TagCategory>;
        Update: BaseUpdate<TagCategory>;
      };
      notes: {
        Row: Note; // Note type already uses snake_case
        Insert: BaseInsert<Note>;
        Update: BaseUpdate<Note>;
      };
      schedules: {
        Row: Schedule; // Schedule type already uses snake_case
        Insert: BaseInsert<Schedule>;
        Update: BaseUpdate<Schedule>;
      };
      documents: {
        Row: DocumentFile; // DocumentFile type already uses snake_case
        Insert: BaseInsert<DocumentFile>;
        Update: BaseUpdate<DocumentFile>;
      };
      plans: {
        Row: Plan; // Plan type already uses snake_case
        Insert: BaseInsert<Plan>;
        Update: BaseUpdate<Plan>;
      };
    };
    Functions: {
      // Define any database functions if you use them
    };
  };
}

// Expose debug functions globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  (window as any).debugUsersTable = debugUsersTable;
  (window as any).testSupabaseConnection = testSupabaseConnection;
  (window as any).clearAuthState = clearAuthState;
  console.log('🌐 Exposed Supabase client to window object');
}