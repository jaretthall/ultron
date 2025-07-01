/// <reference types="cypress" />

describe('Application Navigation and Basic Content', () => {
  beforeEach(() => {
    // Supabase is initialized with placeholder data or could be mocked at a network level if needed for E2E.
    // For this test, we assume the app loads, and Supabase client config doesn't throw immediate critical errors.
    // If App.tsx makes immediate calls that fail without a real backend, those might need stubbing.
    // For now, we'll test assuming the UI renders enough for navigation.
    cy.visit('/');
  });

  it('should load the home page and display header correctly', () => {
    cy.get('header').should('be.visible');
    cy.get('header').contains('Nexus AI Assistant').should('be.visible');
    cy.get('header nav a').contains('Home').should('have.class', 'bg-slate-700'); // Active link
    cy.get('h1').contains('Dashboard').should('be.visible'); // Assuming HomePage has this title
  });

  it('should navigate to Projects page and show project dashboard elements', () => {
    cy.get('header nav a').contains('Projects').click();
    
    // Check for URL change if using react-router-dom path based routing
    // Since this app changes components based on state, not URL paths for main nav,
    // we'll check for content unique to the ProjectDashboardPage.
    cy.url().should('include', '/'); // App.tsx uses internal state for routing, not URL paths
    
    // Check for elements specific to ProjectDashboardPage
    cy.get('aside h2').contains('Projects').should('be.visible'); // Left sidebar heading
    // Main content area might show "No Project Selected" or project details
    cy.get('main').should('be.visible');
    // Check that 'Home' is no longer the active link
    cy.get('header nav a').contains('Home').should('not.have.class', 'bg-slate-700');
    cy.get('header nav a').contains('Projects').should('have.class', 'bg-slate-700');
  });

  it('should navigate to Tasks page', () => {
    cy.get('header nav a').contains('Tasks').click();
    cy.get('h1').contains('Task Management').should('be.visible');
    cy.get('header nav a').contains('Tasks').should('have.class', 'bg-slate-700');
  });

  it('should navigate to Calendar page', () => {
    cy.get('header nav a').contains('Calendar').click();
    cy.get('h1').contains('Calendar').should('be.visible');
    cy.get('header nav a').contains('Calendar').should('have.class', 'bg-slate-700');
  });

  it('should navigate to Documents page', () => {
    cy.get('header nav a').contains('Documents').click();
    cy.get('h1').contains('Documents').should('be.visible');
    cy.get('header nav a').contains('Documents').should('have.class', 'bg-slate-700');
  });

  it('should navigate to Settings page and show settings elements', () => {
    cy.get('header nav a').contains('Settings').click();
    cy.get('h1').contains('Settings').should('be.visible');
    cy.get('header nav a').contains('Settings').should('have.class', 'bg-slate-700');
    // Check for a tab, e.g., "AI Provider"
    cy.get('nav[aria-label="Tabs"]').contains('AI Provider').should('be.visible');
  });

  // Example of testing a button click on the Home page (if New Project Modal was on Home)
  // This depends on the exact structure of your App.tsx and HomePage.tsx
  it('should open New Project modal from Home page', () => {
    cy.visit('/'); // Ensure we are on Home page
    // The "New Project" button is on the HomePage in the current structure
    // (not ProjectDashboardPage)
    // Find button by text or a more specific selector
    cy.get('button').contains('New Project').click();
    cy.get('h2#newProjectModalTitle').contains('Create New Project').should('be.visible');
  });
});