/// <reference types="cypress" />

// Custom commands for authentication mocking
declare global {
  namespace Cypress {
    interface Chainable {
      mockAuth(): Chainable<void>;
      mockAuthenticatedUser(): Chainable<void>;
      mockUnauthenticatedUser(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('mockAuth', () => {
  cy.window().then((win) => {
    // Mock Supabase auth methods
    const mockSupabase = {
      auth: {
        getUser: () => Promise.resolve({
          data: { 
            user: { 
              id: 'test-user-id', 
              email: 'test@example.com',
              aud: 'authenticated',
              role: 'authenticated'
            } 
          },
          error: null
        }),
        signInWithPassword: () => Promise.resolve({
          data: {
            user: { 
              id: 'test-user-id', 
              email: 'test@example.com',
              aud: 'authenticated',
              role: 'authenticated'
            },
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh-token'
            }
          },
          error: null
        }),
        signUp: () => Promise.resolve({
          data: {
            user: { 
              id: 'test-user-id', 
              email: 'test@example.com',
              aud: 'authenticated',
              role: 'authenticated'
            },
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh-token'
            }
          },
          error: null
        }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: (callback: Function) => {
          // Immediately call with signed in state
          setTimeout(() => {
            callback('SIGNED_IN', {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh-token',
              user: { 
                id: 'test-user-id', 
                email: 'test@example.com',
                aud: 'authenticated',
                role: 'authenticated'
              }
            });
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

    // Mock the supabase client globally
    (win as any).supabase = mockSupabase;
    
    // Mock environment variables if needed
    (win as any).VITE_SUPABASE_URL = 'mock-url';
    (win as any).VITE_SUPABASE_ANON_KEY = 'mock-key';
  });
});

Cypress.Commands.add('mockAuthenticatedUser', () => {
  cy.mockAuth();
  cy.window().then((win) => {
    // Set localStorage to simulate authenticated state
    win.localStorage.setItem('sb-mock-auth-token', JSON.stringify({
      access_token: 'mock-token',
      user: { 
        id: 'test-user-id', 
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated'
      }
    }));
  });
});

Cypress.Commands.add('mockUnauthenticatedUser', () => {
  cy.window().then((win) => {
    // Clear any auth state
    win.localStorage.clear();
    win.sessionStorage.clear();
    
    // Mock Supabase to return no user
    const mockSupabase = {
      auth: {
        getUser: () => Promise.resolve({
          data: { user: null },
          error: null
        }),
        signInWithPassword: (credentials: any) => {
          if (credentials.email === 'test@example.com' && credentials.password === 'TestPassword123!') {
            return Promise.resolve({
              data: {
                user: { 
                  id: 'test-user-id', 
                  email: 'test@example.com',
                  aud: 'authenticated',
                  role: 'authenticated'
                },
                session: {
                  access_token: 'mock-token',
                  refresh_token: 'mock-refresh-token'
                }
              },
              error: null
            });
          }
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: 'Invalid credentials' }
          });
        },
        signUp: (credentials: any) => {
          return Promise.resolve({
            data: {
              user: { 
                id: 'test-user-id', 
                email: credentials.email,
                aud: 'authenticated',
                role: 'authenticated'
              },
              session: {
                access_token: 'mock-token',
                refresh_token: 'mock-refresh-token'
              }
            },
            error: null
          });
        },
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: (callback: Function) => {
          // Start with unauthenticated state
          setTimeout(() => {
            callback('SIGNED_OUT', null);
          }, 100);
          return {
            data: {
              subscription: {
                unsubscribe: () => {}
              }
            }
          };
        }
      }
    };

    (win as any).supabase = mockSupabase;
  });
});

export {};