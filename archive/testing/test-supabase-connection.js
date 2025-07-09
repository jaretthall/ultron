// Test Supabase Connection
// This is a Node.js script to test the connection outside the browser

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mldklirjxxxegcxyweug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZGtsaXJqeHh4ZWdjeHl3ZXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzg4NDUsImV4cCI6MjA2NDY1NDg0NX0.CXeXX_ltTy4GWTloUr2LmjENXQ5bDF7F18TDlVHUcR4';

async function testConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client created');
    
    // Test all major tables
    const tables = ['projects', 'tasks', 'users', 'user_preferences', 'schedules', 'tags'];
    
    for (const table of tables) {
      console.log(`📊 Testing table: ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table ${table} error:`, error);
        
        if (error.code === 'PGRST106') {
          console.log(`💡 Table "${table}" not found - need to create schema`);
        } else if (error.message.includes('permission')) {
          console.log(`💡 Permission issue for table "${table}" - RLS policy problem`);
        }
      } else {
        console.log(`✅ Table ${table} accessible - ${data?.length || 0} records`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

testConnection();