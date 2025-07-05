import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Project, Task, UserPreferences, Tag, TagCategory, Note, Schedule, DocumentFile, Plan
} from '../types'; // Path should be correct if types.ts is in src/

// Supabase configuration - Prioritize environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

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
                   supabaseAnonKey.length > 30); // Support both JWT and publishable key formats
  
  return urlValid && keyValid;
};

// Initialize Supabase client with better error handling
const initializeSupabase = () => {
  console.log('🔍 Initializing Supabase client...');
  console.log('- URL:', supabaseUrl);
  console.log('- Key length:', supabaseAnonKey?.length || 0);
  console.log('- URL valid:', supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL_PLACEHOLDER' && supabaseUrl.startsWith('https://'));
  console.log('- Key valid:', supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_PLACEHOLDER' && supabaseAnonKey.length > 30);
  
  if (!isSupabaseConfigured()) {
    console.warn(
      "⚠️ Supabase configuration issue detected:",
      "\n- URL:", supabaseUrl,
      "\n- Key length:", supabaseAnonKey?.length || 0,
      "\nPlease check your environment variables or update lib/supabaseClient.ts"
    );
    return null;
  }

  try {
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
        }
      }
    });

    console.log('✅ Supabase client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error);
    return null;
  }
};

supabaseSingleton = initializeSupabase();

export const supabase = supabaseSingleton;

// Export a function to test the connection
export const testSupabaseConnection = async () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
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
  (window as any).debugUsersTable = debugUsersTable;
  (window as any).testSupabaseConnection = testSupabaseConnection;
  (window as any).clearAuthState = clearAuthState;
}