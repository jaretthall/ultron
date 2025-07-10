/// <reference types="cypress" />

// Custom commands for authentication mocking
declare global {
  namespace Cypress {
    interface Chainable {
      mockAuthenticatedUser(): Chainable<void>;
      mockUnauthenticatedUser(): Chainable<void>;
      visitWithAuth(url?: string): Chainable<void>;
      visitWithoutAuth(url?: string): Chainable<void>;
    }
  }
}

// Create mock Supabase client
const createMockSupabase = (isAuthenticated: boolean = false) => {
  const mockUser = isAuthenticated ? {
    id: 'test-user-id',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString()
  } : null;

  const mockSession = isAuthenticated ? {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: mockUser
  } : null;

  return {
    auth: {
      getUser: () => Promise.resolve({
        data: { user: mockUser },
        error: null
      }),
      getSession: () => Promise.resolve({
        data: { session: mockSession },
        error: null
      }),
      signInWithPassword: (credentials: any) => {
        if (credentials.email === 'test@example.com' && credentials.password === 'TestPassword123!') {
          return Promise.resolve({
            data: { user: mockUser, session: mockSession },
            error: null
          });
        }
        return Promise.resolve({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' }
        });
      },
      signUp: (credentials: any) => Promise.resolve({
        data: {
          user: { ...mockUser, email: credentials.email },
          session: mockSession
        },
        error: null
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback: Function) => {
        setTimeout(() => {
          if (isAuthenticated) {
            callback('SIGNED_IN', mockSession);
          } else {
            callback('SIGNED_OUT', null);
          }
        }, 100);
        return {
          data: {
            subscription: {
              unsubscribe: () => {}
            }
          }
        };
      }
    },
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: {}, error: null })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: {}, error: null })
          })
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    })
  };
};

Cypress.Commands.add('visitWithAuth', (url = '/') => {
  cy.intercept('POST', '**/auth/v1/**', {
    statusCode: 200,
    body: {
      access_token: 'mock-access-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    }
  });

  cy.intercept('GET', '**/auth/v1/**', {
    statusCode: 200,
    body: {
      id: 'test-user-id',
      email: 'test@example.com'
    }
  });

  cy.intercept('GET', '**/rest/v1/**', {
    statusCode: 200,
    body: []
  });

  cy.visit(url, {
    onBeforeLoad: (win) => {
      // Set environment variables
      Object.defineProperty(win, 'VITE_SUPABASE_URL', {
        value: 'https://mock.supabase.co',
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(win, 'VITE_SUPABASE_ANON_KEY', {
        value: 'mock-key-' + 'x'.repeat(100),
        writable: true,
        configurable: true
      });

      // Mock the global supabase
      Object.defineProperty(win, 'supabase', {
        value: createMockSupabase(true),
        writable: true,
        configurable: true
      });

      // Set localStorage auth state for CustomAuth
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      };
      
      const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      win.localStorage.setItem('ultron_custom_user', JSON.stringify(mockUser));
      win.localStorage.setItem('ultron_session_expiry', sessionExpiry.toString());
    }
  });
});

Cypress.Commands.add('visitWithoutAuth', (url = '/') => {
  cy.intercept('POST', '**/auth/v1/**', (req) => {
    const { email, password } = req.body;
    if (email === 'test@example.com' && password === 'TestPassword123!') {
      req.reply({
        statusCode: 200,
        body: {
          access_token: 'mock-access-token',
          user: { id: 'test-user-id', email: 'test@example.com' }
        }
      });
    } else {
      req.reply({
        statusCode: 400,
        body: { error: { message: 'Invalid credentials' } }
      });
    }
  });

  cy.intercept('GET', '**/auth/v1/**', {
    statusCode: 401,
    body: { error: { message: 'Invalid JWT' } }
  });

  cy.visit(url, {
    onBeforeLoad: (win) => {
      // Clear any existing auth state
      win.localStorage.clear();
      win.sessionStorage.clear();

      // Set environment variables
      Object.defineProperty(win, 'VITE_SUPABASE_URL', {
        value: 'https://mock.supabase.co',
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(win, 'VITE_SUPABASE_ANON_KEY', {
        value: 'mock-key-' + 'x'.repeat(100),
        writable: true,
        configurable: true
      });

      // Mock the global supabase
      Object.defineProperty(win, 'supabase', {
        value: createMockSupabase(false),
        writable: true,
        configurable: true
      });
    }
  });
});

// Simplified commands that use the visit commands
Cypress.Commands.add('mockAuthenticatedUser', () => {
  // This will be handled in the test when calling cy.visitWithAuth()
  cy.log('Auth mocking will be set up on visit');
});

Cypress.Commands.add('mockUnauthenticatedUser', () => {
  // This will be handled in the test when calling cy.visitWithoutAuth()
  cy.log('Unauth mocking will be set up on visit');
});

export {};