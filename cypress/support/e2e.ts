/// <reference types="cypress" />

// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively, you can require() MOCK_PROJECT_CONTEXT_VALUEcommands from CJS modules:
// require('./commands')

// Suppress "uncaught exception" errors from the application if they are not relevant to the test
// For example, if ResizeObserver loop limit exceeded error occurs.
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // Decide if this error should fail the test or not.
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Supabase client not initialized')) {
    return false;
  }
  if (err.message.includes('Network Error')) {
    return false;
  }
  // Allow other errors to fail the test
  return true;
});

// Global setup for all tests
beforeEach(() => {
  // Set up global window properties before app loads
  cy.window().then((win) => {
    // Mock environment variables
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
  });
});