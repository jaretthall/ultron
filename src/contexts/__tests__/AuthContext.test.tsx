import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../../services/databaseService';

// Mock the database service
jest.mock('../../../services/databaseService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    onAuthStateChange: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Test component to access auth context
const TestComponent = () => {
  const { user, session, loading, signUp, signIn, signOut, isAuthenticated } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-email">{user?.email || 'No User'}</div>
      <button onClick={() => signUp('test@example.com', 'password123')}>Sign Up</button>
      <button onClick={() => signIn('test@example.com', 'password123')}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSession = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock setup
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
  });

  it('should provide initial unauthenticated state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
  });

  it('should provide authenticated state when user exists', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });

  it('should handle sign up successfully', async () => {
    const user = userEvent.setup();
    mockAuthService.signUp.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    await user.click(screen.getByText('Sign Up'));

    expect(mockAuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should handle sign in successfully', async () => {
    const user = userEvent.setup();
    mockAuthService.signIn.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    await user.click(screen.getByText('Sign In'));

    expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should handle sign out successfully', async () => {
    const user = userEvent.setup();
    mockAuthService.signOut.mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    await user.click(screen.getByText('Sign Out'));

    expect(mockAuthService.signOut).toHaveBeenCalled();
  });

  it('should handle auth state changes via subscription', async () => {
    let authStateCallback: (event: string, session: any) => void;
    
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Simulate auth state change
    authStateCallback!('SIGNED_IN', mockSession);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('should throw error when useAuth is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });

  it('should handle authentication errors', async () => {
    const user = userEvent.setup();
    const authError = new Error('Authentication failed');
    mockAuthService.signIn.mockRejectedValue(authError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    await expect(async () => {
      await user.click(screen.getByText('Sign In'));
    }).rejects.toThrow('Authentication failed');
  });

  it('should cleanup subscription on unmount', () => {
    const unsubscribeMock = jest.fn();
    mockAuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } }
    });

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
}); 