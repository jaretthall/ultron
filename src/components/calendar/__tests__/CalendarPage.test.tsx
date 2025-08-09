import React from 'react';
import { render } from '@testing-library/react';
import CalendarPage from '../CalendarPage';
import { AppStateProvider } from '../../../contexts/AppStateContext';
import { SupabaseAuthProvider } from '../../../contexts/SupabaseAuthContext';
// Import other providers as needed

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <SupabaseAuthProvider>
    <AppStateProvider>
      {children}
    </AppStateProvider>
  </SupabaseAuthProvider>
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