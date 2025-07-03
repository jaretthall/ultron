import React from 'react';
import { CustomAuthProvider, useCustomAuth } from './contexts/CustomAuthContext';
import AuthForm from './components/auth/AuthForm';
import AppWithAuth from '../AppWithAuth';
import LoadingSpinner from './components/LoadingSpinner';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, loading } = useCustomAuth();

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
    <CustomAuthProvider>
      <AuthenticatedApp />
    </CustomAuthProvider>
  );
};

export default App;
