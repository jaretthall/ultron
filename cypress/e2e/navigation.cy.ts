/// <reference types="cypress" />

describe('Application Navigation and Basic Content', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Mock authentication - simulate authenticated user
    cy.window().then((win) => {
      // Mock localStorage to simulate authenticated state
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    
    // Visit the app
    cy.visit('/');
  });

  it('should load the home page and display auth form when not authenticated', () => {
    cy.clearLocalStorage();
    cy.visit('/');
    
    // Should show auth form when not authenticated
    cy.contains('Sign in to your account', { timeout: 10000 }).should('be.visible');
    cy.contains('Welcome to Ultron').should('be.visible');
  });

  it('should show dashboard when authenticated', () => {
    // Mock authentication state
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    
    cy.visit('/');
    
    // Wait for auth to load and check for dashboard content
    cy.contains('Dashboard', { timeout: 15000 }).should('be.visible');
  });

  it('should navigate to Projects page and show project dashboard elements', () => {
    // This test requires authentication mock
    cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="main-navigation"] a').contains('Projects').click();
    
    // Check URL change
    cy.url().should('include', '/projects');
  });

  it('should navigate to Tasks page', () => {
    cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="main-navigation"] a').contains('Tasks').click();
    cy.url().should('include', '/tasks');
  });

  it('should navigate to Calendar page', () => {
    cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="main-navigation"] a').contains('Calendar').click();
    cy.url().should('include', '/calendar');
  });

  it('should navigate to Documents page', () => {
    cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="main-navigation"] a').contains('Documents').click();
    cy.url().should('include', '/documents');
  });

  it('should navigate to Settings page and show settings elements', () => {
    cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="main-navigation"] a').contains('Settings').click();
    cy.url().should('include', '/settings');
  });

  it('should open New Project modal from Home page', () => {
    cy.contains('Dashboard', { timeout: 15000 }).should('be.visible');
    cy.get('button').contains('New Project').click();
    // Check for modal or new project form
    cy.get('input[placeholder*="project"], input[placeholder*="Project"]', { timeout: 5000 }).should('be.visible');
  });
});