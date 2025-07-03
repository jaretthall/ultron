import React from 'react';
import { isSupabaseConfigured } from './lib/supabaseClient';
import LoadingSpinner from './src/components/LoadingSpinner';
import ErrorBoundary from './src/components/ErrorBoundary';
import { CustomAuthProvider, useCustomAuth } from './src/contexts/CustomAuthContext';
import AuthForm from './src/components/auth/AuthForm';
import AppWithAuth from './AppWithAuth';

// Main App wrapper component
const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useCustomAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return <AppWithAuth />;
};

const App: React.FC = () => {
  // Note: With custom auth, we don't require Supabase to be configured
  // The app will work with localStorage fallback
  const supabaseConfigured = isSupabaseConfigured();
  
  if (!supabaseConfigured) {
    console.log('🔄 Supabase not configured, using localStorage fallback mode');
  }

  return (
    <CustomAuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </CustomAuthProvider>
  );
};

export default App;
