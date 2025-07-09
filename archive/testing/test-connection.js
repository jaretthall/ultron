// Test script to verify Supabase connection
import { testSupabaseConnection } from './lib/supabaseClient.js';

console.log('🔍 Testing Supabase connection...');

// Test the connection
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('✅ Connection test passed!');
      process.exit(0);
    } else {
      console.log('❌ Connection test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Connection test error:', error);
    process.exit(1);
  });