import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from './contexts/SupabaseAuthContext';
import AuthForm from './components/auth/AuthForm';
import UpdatePasswordPage from './components/auth/UpdatePasswordPage';
import AppWithAuth from './AppWithAuth';
import LoadingSpinner from './components/LoadingSpinner';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, loading } = useSupabaseAuth();
  const location = useLocation();

  // Allow password reset page without authentication
  if (location.pathname === '/update-password') {
    return <UpdatePasswordPage />;
  }

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
      <Routes>
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="*" element={<AuthenticatedApp />} />
      </Routes>
    </SupabaseAuthProvider>
  );
};

export default App;
