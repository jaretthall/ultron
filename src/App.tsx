import React from 'react';
import { SupabaseAuthProvider, useSupabaseAuth } from './contexts/SupabaseAuthContext';
import AuthForm from './components/auth/AuthForm';
import AppWithAuth from './AppWithAuth';
import LoadingSpinner from './components/LoadingSpinner';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return <AppWithAuth />;
};

const App: React.FC = () => {
  return (
    <SupabaseAuthProvider>
      <AuthenticatedApp />
    </SupabaseAuthProvider>
  );
};

export default App;
