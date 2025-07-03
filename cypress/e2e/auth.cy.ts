/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Mock Supabase auth for testing
    cy.window().then((win) => {
      // Mock the global API_KEY if needed
      (win as any).API_KEY = 'test-api-key';
    });
  });

  describe('Unauthenticated State', () => {
    it('should show authentication required message for protected routes', () => {
      cy.visit('/');
      
      // Should show auth form when not authenticated
      cy.contains('Sign in to your account', { timeout: 10000 }).should('be.visible');
      cy.contains('Welcome to Ultron').should('be.visible');
    });

    it('should not allow access to protected features without authentication', () => {
      cy.visit('/');
      
      // Verify no protected content is accessible
      cy.get('[data-testid="dashboard-content"]').should('not.exist');
      cy.get('[data-testid="project-list"]').should('not.exist');
      cy.get('[data-testid="task-list"]').should('not.exist');
    });
  });

  describe('Sign Up Flow', () => {
    it('should allow user to sign up with valid credentials', () => {
      cy.visit('/');
      
      // Look for sign up form or button
      cy.get('[data-testid="sign-up-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Fill out sign up form
      cy.get('[data-testid="email-input"]').type('newuser@example.com');
      cy.get('[data-testid="password-input"]').type('SecurePassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('SecurePassword123!');
      
      // Submit form
      cy.get('[data-testid="submit-signup"]').click();
      
      // Should show success message or redirect
      cy.contains('Account created successfully', { timeout: 15000 }).should('be.visible');
    });

    it('should show validation errors for invalid sign up data', () => {
      cy.visit('/');
      
      cy.get('[data-testid="sign-up-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Try to submit with empty fields
      cy.get('[data-testid="submit-signup"]').click();
      
      // Should show validation errors
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should validate password strength requirements', () => {
      cy.visit('/');
      
      cy.get('[data-testid="sign-up-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Enter weak password
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('123');
      cy.get('[data-testid="submit-signup"]').click();
      
      // Should show password strength error
      cy.contains('Password must be at least 8 characters').should('be.visible');
    });
  });

  describe('Sign In Flow', () => {
    it('should allow user to sign in with valid credentials', () => {
      cy.visit('/');
      
      // Look for sign in form or button
      cy.get('[data-testid="sign-in-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Fill out sign in form
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      
      // Submit form
      cy.get('[data-testid="submit-signin"]').click();
      
      // Should redirect to dashboard after successful login
      cy.url({ timeout: 15000 }).should('eq', `${Cypress.config().baseUrl}/`);
      cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/');
      
      cy.get('[data-testid="sign-in-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Enter invalid credentials
      cy.get('[data-testid="email-input"]').type('wrong@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="submit-signin"]').click();
      
      // Should show error message
      cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/');
      
      cy.get('[data-testid="sign-in-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Try to submit with empty fields
      cy.get('[data-testid="submit-signin"]').click();
      
      // Should show validation errors
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      // Mock successful authentication
      cy.window().then((win) => {
        // Simulate logged-in state by setting localStorage or mocking auth state
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          user: { id: 'test-user', email: 'test@example.com' }
        }));
      });
    });

    it('should show authenticated content after login', () => {
      cy.visit('/');
      
      // Should show dashboard content
      cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.get('[data-testid="main-navigation"]').should('be.visible');
    });

    it('should allow navigation to all protected routes', () => {
      cy.visit('/');
      
      // Test navigation to different sections
      const routes = ['Projects', 'Tasks', 'Calendar', 'Documents', 'Settings'];
      
      routes.forEach(route => {
        cy.contains(route).click();
        cy.url().should('include', '/');
        cy.contains(route, { timeout: 5000 }).should('be.visible');
      });
    });
  });

  describe('Sign Out Flow', () => {
    beforeEach(() => {
      // Start with authenticated state
      cy.window().then((win) => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          user: { id: 'test-user', email: 'test@example.com' }
        }));
      });
    });

    it('should allow user to sign out', () => {
      cy.visit('/');
      
      // Click user menu and sign out
      cy.get('[data-testid="user-menu"]', { timeout: 10000 }).click();
      cy.get('[data-testid="sign-out-button"]').click();
      
      // Should redirect to authentication page
      cy.contains('Authentication Required', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="user-menu"]').should('not.exist');
    });

    it('should clear user session data on sign out', () => {
      cy.visit('/');
      
      cy.get('[data-testid="user-menu"]', { timeout: 10000 }).click();
      cy.get('[data-testid="sign-out-button"]').click();
      
      // Verify session data is cleared
      cy.window().then((win) => {
        const authData = localStorage.getItem('supabase.auth.token');
        expect(authData).to.be.null;
      });
    });
  });

  describe('Protected Route Behavior', () => {
    it('should redirect unauthenticated users attempting to access protected routes', () => {
      // Try to access different protected routes directly
      const protectedRoutes = ['/projects', '/tasks', '/calendar', '/documents', '/settings'];
      
      protectedRoutes.forEach(route => {
        cy.visit(route);
        
        // Should show authentication required or redirect
        cy.contains('Authentication Required', { timeout: 5000 }).should('be.visible');
        cy.url().should('not.include', route);
      });
    });

    it('should maintain authentication state across browser refresh', () => {
      // Set authenticated state
      cy.window().then((win) => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          user: { id: 'test-user', email: 'test@example.com' }
        }));
      });
      
      cy.visit('/');
      cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
      
      // Refresh the page
      cy.reload();
      
      // Should still be authenticated
      cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully during authentication', () => {
      // Intercept and fail auth requests
      cy.intercept('POST', '**/auth/**', { forceNetworkError: true }).as('authRequest');
      
      cy.visit('/');
      cy.get('[data-testid="sign-in-button"]', { timeout: 10000 }).should('be.visible').click();
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="submit-signin"]').click();
      
      // Should show network error message
      cy.contains('Network error', { timeout: 10000 }).should('be.visible');
    });

    it('should show loading states during authentication', () => {
      // Intercept and delay auth requests
      cy.intercept('POST', '**/auth/**', { delay: 2000 }).as('authRequest');
      
      cy.visit('/');
      cy.get('[data-testid="sign-in-button"]', { timeout: 10000 }).should('be.visible').click();
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="submit-signin"]').click();
      
      // Should show loading indicator
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.get('[data-testid="submit-signin"]').should('be.disabled');
    });
  });
}); 