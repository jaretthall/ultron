import React from 'react';
import { render } from '@testing-library/react';
import WeekView from '../WeekView';

const mockProps = {
  currentDate: new Date(),
  events: [],
  selectedDate: new Date(),
  onDateSelect: jest.fn(),
  onEventClick: jest.fn(),
};

describe('WeekView', () => {
  it('renders without crashing', () => {
    render(<WeekView {...mockProps} />);
  });
}); 