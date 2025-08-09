import React from 'react';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase, testSupabaseConnection, clearAuthState } from '../../../lib/supabaseClient';

const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, loading, session } = useSupabaseAuth();

  const handleTestConnection = async () => {
    console.log('🔍 Testing Supabase connection...');
    const result = await testSupabaseConnection();
    alert(`Connection test: ${result ? 'SUCCESS' : 'FAILED'} - Check console for details`);
  };

  const handleClearAuthState = () => {
    console.log('🧹 Clearing auth state...');
    clearAuthState();
    alert('Auth state cleared. Please refresh the page and try signing in again.');
  };

  const handleGetCurrentSession = async () => {
    if (!supabase) {
      alert('Supabase client not available');
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('🔍 Current session:', { data, error });
      alert(`Session check complete - see console for details`);
    } catch (error) {
      console.error('Session error:', error);
      alert(`Session error: ${error}`);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-slate-100">Authentication Debug</h3>
      
      <div className="space-y-4">
        {/* Current Auth State */}
        <div className="bg-slate-700 p-4 rounded">
          <h4 className="font-medium text-slate-200 mb-2">Current Auth State</h4>
          <div className="text-sm text-slate-300 space-y-1">
            <div>Loading: <span className={loading ? 'text-yellow-400' : 'text-green-400'}>{loading.toString()}</span></div>
            <div>Authenticated: <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>{isAuthenticated.toString()}</span></div>
            <div>User Email: <span className="text-blue-400">{user?.email || 'None'}</span></div>
            <div>User ID: <span className="text-blue-400">{user?.id || 'None'}</span></div>
            <div>Session Exists: <span className={session ? 'text-green-400' : 'text-red-400'}>{!!session ? 'Yes' : 'No'}</span></div>
          </div>
        </div>

        {/* Debug Actions */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-200">Debug Actions</h4>
          
          <button
            onClick={handleTestConnection}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm"
          >
            Test Supabase Connection
          </button>
          
          <button
            onClick={handleGetCurrentSession}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded text-sm"
          >
            Check Current Session
          </button>
          
          <button
            onClick={handleClearAuthState}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded text-sm"
          >
            Clear Auth State & Restart
          </button>
        </div>

        {/* Environment Info */}
        <div className="bg-slate-700 p-4 rounded">
          <h4 className="font-medium text-slate-200 mb-2">Environment Info</h4>
          <div className="text-sm text-slate-300 space-y-1">
            <div>Supabase Client: <span className={supabase ? 'text-green-400' : 'text-red-400'}>{supabase ? 'Available' : 'Not Available'}</span></div>
            <div>Environment: <span className="text-blue-400">{import.meta.env.MODE || 'Unknown'}</span></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-700 p-4 rounded">
          <h4 className="font-medium text-slate-200 mb-2">Troubleshooting Steps</h4>
          <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
            <li>Check if Supabase connection test passes</li>
            <li>If not authenticated, try clearing auth state and signing in again</li>
            <li>Check browser console for detailed error messages</li>
            <li>Verify .env variables are properly set</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;