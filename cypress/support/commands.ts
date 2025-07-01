
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Add type declarations for custom commands if you're using TypeScript
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       customCommand(param: string): Chainable<Element>;
//     }
//   }
// }
//
// export function customCommand(param: string) {
//   console.log(param);
//   return cy.wrap(param);
// }
//
// Cypress.Commands.add('customCommand', customCommand)
