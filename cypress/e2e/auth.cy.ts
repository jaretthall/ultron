/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Unauthenticated State', () => {
    it('should show authentication required message for protected routes', () => {
      cy.visitWithoutAuth('/');
      
      // Should show auth form when not authenticated
      cy.contains('Sign in to your account', { timeout: 10000 }).should('be.visible');
      cy.contains('Welcome to Ultron').should('be.visible');
    });

    it('should not allow access to protected features without authentication', () => {
      cy.visitWithoutAuth('/');
      
      // Verify no protected content is accessible
      cy.get('[data-testid="dashboard-content"]').should('not.exist');
      cy.get('[data-testid="project-list"]').should('not.exist');
      cy.get('[data-testid="task-list"]').should('not.exist');
    });
  });

  describe('Sign Up Flow', () => {
    beforeEach(() => {
      cy.visitWithoutAuth('/');
    });

    it('should allow user to sign up with valid credentials', () => {
      // Start in sign up mode
      cy.get('[data-testid="sign-up-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Fill out sign up form
      cy.get('[data-testid="email-input"]').type('newuser@example.com');
      cy.get('[data-testid="password-input"]').type('SecurePassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('SecurePassword123!');
      
      // Submit form
      cy.get('[data-testid="submit-signup"]').click();
      
      // Should show success message
      cy.contains('Account created successfully', { timeout: 15000 }).should('be.visible');
    });

    it('should show validation errors for invalid sign up data', () => {
      // Start in sign up mode
      cy.get('[data-testid="sign-up-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Try to submit with empty fields
      cy.get('[data-testid="submit-signup"]').click();
      
      // Should show validation errors
      cy.contains('Email is required', { timeout: 4000 }).should('be.visible');
    });

    it('should validate password strength requirements', () => {
      // Start in sign up mode
      cy.get('[data-testid="sign-up-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Enter weak password
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('123');
      cy.get('[data-testid="submit-signup"]').click();
      
      // Should show password strength error
      cy.contains('Password must be at least 8 characters', { timeout: 4000 }).should('be.visible');
    });
  });

  describe('Sign In Flow', () => {
    beforeEach(() => {
      cy.visitWithoutAuth('/');
    });

    it('should allow user to sign in with valid credentials', () => {
      // Should start in sign in mode by default
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      
      // Submit form
      cy.get('[data-testid="submit-signin"]').click();
      
      // Should redirect to dashboard after successful login
      cy.contains('Dashboard', { timeout: 15000 }).should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      // Fill out sign in form with invalid credentials
      cy.get('[data-testid="email-input"]').type('invalid@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      
      // Submit form
      cy.get('[data-testid="submit-signin"]').click();
      
      // Should show error message
      cy.contains('Invalid credentials', { timeout: 10000 }).should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      // Try to submit with empty fields
      cy.get('[data-testid="submit-signin"]').click();
      
      // Should show validation errors
      cy.contains('Email is required', { timeout: 4000 }).should('be.visible');
    });
  });

  describe('Authenticated State', () => {
    it('should show authenticated content after login', () => {
      cy.visitWithAuth('/');
      
      // Should show dashboard content
      cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
    });

    it('should allow navigation to all protected routes', () => {
      cy.visitWithAuth('/');
      
      // Wait for navigation to be available
      cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
      
      const routes = ['/projects', '/tasks', '/calendar', '/documents', '/settings'];
      
      routes.forEach(route => {
        cy.get('[data-testid="main-navigation"] a').contains(route.replace('/', '').charAt(0).toUpperCase() + route.slice(2)).click();
        cy.url({ timeout: 4000 }).should('include', route);
      });
    });
  });

  describe('Sign Out Flow', () => {
    beforeEach(() => {
      cy.visitWithAuth('/');
    });

    it('should allow user to sign out', () => {
      // Wait for user menu to be available
      cy.get('[data-testid="user-menu"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="sign-out-button"]').click();
      
      // Should return to auth form
      cy.contains('Sign in to your account', { timeout: 10000 }).should('be.visible');
    });

    it('should clear user session data on sign out', () => {
      // Wait for user menu to be available
      cy.get('[data-testid="user-menu"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="sign-out-button"]').click();
      
      // Should return to auth form and not show protected content
      cy.contains('Sign in to your account', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="main-navigation"]').should('not.exist');
    });
  });

  describe('Protected Route Behavior', () => {
    it('should redirect unauthenticated users attempting to access protected routes', () => {
      const protectedRoutes = ['/projects', '/tasks', '/calendar', '/documents', '/settings'];
      
      protectedRoutes.forEach(route => {
        cy.visitWithoutAuth(route);
        // Should show auth form instead of protected content
        cy.contains('Sign in to your account', { timeout: 5000 }).should('be.visible');
      });
    });

    it('should maintain authentication state across browser refresh', () => {
      cy.visitWithAuth('/');
      
      // Should show dashboard content
      cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
      
      // Refresh the page
      cy.reload();
      
      // Should still show dashboard content
      cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.visitWithoutAuth('/');
    });

    it('should handle network errors gracefully during authentication', () => {
      // Mock network failure
      cy.intercept('POST', '**', { forceNetworkError: true }).as('networkError');
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="submit-signin"]').click();
      
      // Should show error message (implementation dependent)
      cy.contains('error', { timeout: 10000 }).should('be.visible');
    });

    it('should show loading states during authentication', () => {
      // Mock slow response
      cy.intercept('POST', '**', { delay: 2000 }).as('slowAuth');
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="submit-signin"]').click();
      
      // Should show loading state
      cy.contains('Signing in...', { timeout: 1000 }).should('be.visible');
    });
  });
});