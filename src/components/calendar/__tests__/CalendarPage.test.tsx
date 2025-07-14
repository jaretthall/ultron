import React from 'react';
import { render } from '@testing-library/react';
import CalendarPage from '../CalendarPage';
import { AppStateProvider } from '../../../contexts/AppStateContext';
// Import other providers as needed

// If CalendarPage requires more providers, add them here
const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <AppStateProvider>
    {children}
  </AppStateProvider>
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