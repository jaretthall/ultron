import React, { useState } from 'react';
import { supabase, clearAuthState, diagnoseJWTIssue } from '../../../lib/supabaseClient';

const SupabaseDebug: React.FC = () => {
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const log = (message: string) => {
    setOutput(prev => `${prev}\n${message}`);
  };

  const clearOutput = () => setOutput('');

  const testConnection = async () => {
    setLoading(true);
    clearOutput();
    log('🔍 Testing Supabase connection...');
    
    try {
      if (!supabase) {
        log('❌ Supabase client not initialized');
        return;
      }

      // Test basic connection
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        log(`❌ Session Error: ${sessionError.message}`);
        if (sessionError.message.includes('JWT') || sessionError.message.includes('invalid')) {
          log('🔧 This looks like a JWT token issue!');
          log('💡 Try clicking "Clear Auth State" below');
        }
      } else {
        log('✅ Session check passed');
        log(`Session: ${sessionData.session ? 'Active' : 'None'}`);
        if (sessionData.session?.user) {
          log(`User: ${sessionData.session.user.email}`);
        }
      }

      // Test user retrieval
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        log(`❌ User Error: ${userError.message}`);
      } else {
        log(`✅ User check: ${userData.user ? userData.user.email : 'No user'}`);
      }

    } catch (error: any) {
      log(`❌ Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = async () => {
    setLoading(true);
    clearOutput();
    log('🧹 Clearing all authentication state...');
    
    try {
      // Sign out from Supabase first
      if (supabase) {
        await supabase.auth.signOut();
        log('✅ Signed out from Supabase');
      }
      
      // Clear local storage
      const success = clearAuthState();
      if (success) {
        log('✅ Cleared localStorage and sessionStorage');
        log('🔄 Please refresh the page and try logging in again');
      } else {
        log('❌ Failed to clear auth state');
      }
    } catch (error: any) {
      log(`❌ Error clearing auth: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const diagnoseJWT = async () => {
    setLoading(true);
    clearOutput();
    log('🔍 Diagnosing JWT issues...');
    
    try {
      await diagnoseJWTIssue();
      log('✅ Diagnosis complete - check browser console for details');
    } catch (error: any) {
      log(`❌ Diagnosis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkEnvironment = () => {
    clearOutput();
    log('🔍 Checking environment configuration...');
    
    log(`Supabase URL: ${import.meta.env.VITE_SUPABASE_URL || 'Not set'}`);
    log(`Supabase Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}`);
    
    // Check localStorage keys
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        authKeys.push(key);
      }
    }
    log(`Auth keys in localStorage: ${authKeys.length > 0 ? authKeys.join(', ') : 'None'}`);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔧 Supabase JWT Debug Tool</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Debug Actions</h2>
            <div className="space-y-3">
              <button
                onClick={testConnection}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading ? 'Testing...' : '🔍 Test Connection'}
              </button>
              
              <button
                onClick={clearAuth}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading ? 'Clearing...' : '🧹 Clear Auth State'}
              </button>
              
              <button
                onClick={diagnoseJWT}
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading ? 'Diagnosing...' : '🔍 Diagnose JWT'}
              </button>
              
              <button
                onClick={checkEnvironment}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                📋 Check Environment
              </button>
              
              <button
                onClick={clearOutput}
                className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                🗑️ Clear Output
              </button>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Debug Output</h2>
            <div className="bg-black p-4 rounded h-96 overflow-y-auto">
              <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">
                {output || 'Click a debug action to see output...'}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-slate-800 p-4 rounded">
          <h3 className="font-semibold mb-2">💡 Quick Fix Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Clear Auth State" to remove invalid tokens</li>
            <li>Refresh the page</li>
            <li>Try logging in with a fresh account</li>
            <li>If still failing, check Supabase project status</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SupabaseDebug;