import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/auth/AuthForm';
import AppWithAuth from './AppWithAuth';
import LoadingSpinner from './components/LoadingSpinner';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

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
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

export default App;
