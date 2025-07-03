import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renders the title and value correctly', () => {
    render(<StatCard title="Active Projects" value={5} />);
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders the icon when provided', () => {
    const TestIcon = () => <svg data-testid="test-icon"></svg>;
    render(<StatCard title="Tasks" value={10} icon={<TestIcon />} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('does not render an icon div if icon is not provided', () => {
    render(<StatCard title="Tasks" value={10} />);
    expect(screen.queryByTestId('test-icon')).toBeNull();
  });

  it('applies the default color class if no color is provided', () => {
    const TestIcon = () => <svg data-testid="test-icon"></svg>;
    render(<StatCard title="Tasks" value={10} icon={<TestIcon />} />);
    const iconWrapper = screen.getByTestId('test-icon').parentElement;
    expect(iconWrapper?.className).toContain('text-sky-400');
  });

  it('applies the specified color class when provided', () => {
    const TestIcon = () => <svg data-testid="test-icon"></svg>;
    render(<StatCard title="Tasks" value={10} icon={<TestIcon />} color="text-red-500" />);
    const iconWrapper = screen.getByTestId('test-icon').parentElement;
    expect(iconWrapper?.className).toContain('text-red-500');
  });
}); 