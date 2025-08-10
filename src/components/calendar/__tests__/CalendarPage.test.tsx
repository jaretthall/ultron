import React from 'react';
import { render } from '@testing-library/react';
import CalendarPage from '../CalendarPage';
import { AppStateProvider } from '../../../contexts/AppStateContext';
import { AuthProvider } from '../../../contexts/AuthContext';
// Import other providers as needed

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <AppStateProvider>
      {children}
    </AppStateProvider>
  </AuthProvider>
);

describe('CalendarPage', () => {
  it('renders without crashing', () => {
    render(
      <AllProviders>
        <CalendarPage />
      </AllProviders>
    );
  });
}); 