import React from 'react';
import { render } from '@testing-library/react';
import CalendarPage from '../CalendarPage';
import { AppStateProvider } from '../../../contexts/AppStateContext';
import { CustomAuthProvider } from '../../../contexts/CustomAuthContext';
// Import other providers as needed

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <CustomAuthProvider>
    <AppStateProvider>
      {children}
    </AppStateProvider>
  </CustomAuthProvider>
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