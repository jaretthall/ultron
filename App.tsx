import React from 'react';
import { isSupabaseConfigured } from './lib/supabaseClient';
import LoadingSpinner from './src/components/LoadingSpinner';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthForm from './src/components/auth/AuthForm';
import AppWithAuth from './AppWithAuth';

// Main App wrapper component
const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return <AppWithAuth />;
};

const App: React.FC = () => {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center">
        <div className="max-w-md mx-auto bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-red-300">Configuration Error</h1>
              <p className="text-sm text-slate-300 mt-2">
                Supabase client is not configured. Please update lib/supabaseClient.ts with your Supabase URL and Anon key.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
};

export default App;
