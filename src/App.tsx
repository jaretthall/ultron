import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from './contexts/SupabaseAuthContext';
import AuthForm from './components/auth/AuthForm';
import UpdatePasswordPage from './components/auth/UpdatePasswordPage';
import AppWithAuth from './AppWithAuth';
import LoadingSpinner from './components/LoadingSpinner';
import AuthDebug from './components/debug/AuthDebug';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, loading, user, session } = useSupabaseAuth();
  const location = useLocation();

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 AuthenticatedApp - Auth State:', {
      loading,
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      hasSession: !!session,
      pathname: location.pathname
    });
  }, [loading, isAuthenticated, user, session, location.pathname]);

  // Allow password reset page without authentication
  if (location.pathname === '/update-password') {
    return <UpdatePasswordPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-slate-400">Checking authentication...</p>
          <div className="mt-8">
            <AuthDebug />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 Not authenticated - showing login form');
    return <AuthForm />;
  }

  console.log('✅ Authenticated - loading app');
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
