import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Project, Task, UserPreferences, Tag, TagCategory, Note, Schedule, DocumentFile, Plan
} from '../types'; // Path should be correct if types.ts is in src/

// Supabase configuration - Update these with your actual values
// In development, these can be hardcoded. In production, use environment variables.
const supabaseUrl = typeof window !== 'undefined' && (window as any).VITE_SUPABASE_URL || 'https://mldklirjxxxegcxyweug.supabase.co';
const supabaseAnonKey = typeof window !== 'undefined' && (window as any).VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZGtsaXJqeHh4ZWdjeHl3ZXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzg4NDUsImV4cCI6MjA2NDY1NDg0NX0.CXeXX_ltTy4GWTloUr2LmjENXQ5bDF7F18TDlVHUcR4';

const SUPABASE_URL_PLACEHOLDER = 'YOUR_SUPABASE_URL_PLACEHOLDER';
const SUPABASE_ANON_KEY_PLACEHOLDER = 'YOUR_SUPABASE_ANON_KEY_PLACEHOLDER';

let supabaseSingleton: SupabaseClient<Database> | null = null;

export const isSupabaseConfigured = (): boolean => {
  const urlValid = supabaseUrl && 
                   supabaseUrl !== SUPABASE_URL_PLACEHOLDER && 
                   supabaseUrl.startsWith('https://') && 
                   supabaseUrl.includes('.supabase.co');
  
  const keyValid = supabaseAnonKey && 
                   supabaseAnonKey !== SUPABASE_ANON_KEY_PLACEHOLDER &&
                   supabaseAnonKey.length > 50; // JWT tokens are typically much longer
  
  return urlValid && keyValid;
};

// Initialize Supabase client with better error handling
const initializeSupabase = () => {
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