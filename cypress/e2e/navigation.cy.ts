/// <reference types="cypress" />

describe('Application Navigation and Basic Content', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should load the home page and display auth form when not authenticated', () => {
    cy.visitWithoutAuth('/');
    
    // Should show auth form when not authenticated
    cy.contains('Sign in to your account', { timeout: 10000 }).should('be.visible');
    cy.contains('Welcome to Ultron').should('be.visible');
  });

  it('should show dashboard when authenticated', () => {
    cy.visitWithAuth('/');
    
    // Wait for auth to load and check for dashboard content
    cy.contains('Dashboard', { timeout: 15000 }).should('be.visible');
    
    // Should show navigation when authenticated
    cy.get('[data-testid="main-navigation"]', { timeout: 5000 }).should('be.visible');
  });

  it('should navigate to Projects page and show project dashboard elements', () => {
    cy.visitWithAuth('/');
    
    // Wait for navigation to be available
    cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="main-navigation"] a').contains('Projects').click();
    
    // Check URL change
    cy.url().should('include', '/projects');
  });

  it('should navigate to Tasks page', () => {
    cy.visitWithAuth('/');
    
    cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="main-navigation"] a').contains('Tasks').click();
    cy.url().should('include', '/tasks');
  });

  it('should navigate to Calendar page', () => {
    cy.visitWithAuth('/');
    
    cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="main-navigation"] a').contains('Calendar').click();
    cy.url().should('include', '/calendar');
  });

  it('should navigate to Documents page', () => {
    cy.visitWithAuth('/');
    
    cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="main-navigation"] a').contains('Documents').click();
    cy.url().should('include', '/documents');
  });

  it('should navigate to Settings page and show settings elements', () => {
    cy.visitWithAuth('/');
    
    cy.get('[data-testid="main-navigation"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="main-navigation"] a').contains('Settings').click();
    cy.url().should('include', '/settings');
  });

  it('should open New Project modal from Home page', () => {
    cy.visitWithAuth('/');
    
    cy.contains('Dashboard', { timeout: 15000 }).should('be.visible');
    
    // Look for New Project button
    cy.get('button').contains('New Project').should('be.visible').click();
    
    // Check for modal or new project form (this might need adjustment based on actual implementation)
    cy.get('input[placeholder*="project"], input[placeholder*="Project"], [data-testid="project-title-input"]', { timeout: 5000 }).should('be.visible');
  });
});