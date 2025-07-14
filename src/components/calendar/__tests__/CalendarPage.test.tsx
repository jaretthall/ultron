import React from 'react';
import { render } from '@testing-library/react';
import CalendarPage from '../CalendarPage';

describe('CalendarPage', () => {
  it('renders without crashing', () => {
    render(<CalendarPage />);
  });
}); 