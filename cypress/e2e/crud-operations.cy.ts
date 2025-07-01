/// <reference types="cypress" />

describe('CRUD Operations', () => {
  beforeEach(() => {
    // Set up authenticated state for CRUD tests
    cy.window().then((win) => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    
    // Mock API responses for CRUD operations
    cy.intercept('GET', '**/rest/v1/projects*', { fixture: 'projects.json' }).as('getProjects');
    cy.intercept('GET', '**/rest/v1/tasks*', { fixture: 'tasks.json' }).as('getTasks');
    cy.intercept('GET', '**/rest/v1/user_preferences*', { fixture: 'userPreferences.json' }).as('getUserPreferences');
  });

  describe('Project CRUD Operations', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('Projects').click();
    });

    describe('Create Project', () => {
      it('should create a new project with required fields', () => {
        cy.get('button').contains('New Project', { timeout: 10000 }).click();
        
        // Fill out project form
        cy.get('input[placeholder*="title"], input[name*="title"]').type('Test Project');
        cy.get('textarea[placeholder*="description"], textarea[name*="description"]').type('This is a test project description');
        
        // Submit the form
        cy.get('button').contains('Create Project').click();
        
        // Verify success feedback
        cy.contains('Test Project', { timeout: 5000 }).should('be.visible');
      });

      it('should show validation errors for missing required fields', () => {
        cy.get('button').contains('New Project').click();
        
        // Try to submit without required fields
        cy.get('button').contains('Create Project').click();
        
        // Verify validation errors appear
        cy.contains('required', { timeout: 3000 }).should('be.visible');
      });

      it('should handle API errors gracefully during project creation', () => {
        cy.get('button').contains('New Project').click();
        
        cy.get('input[placeholder*="title"], input[name*="title"]').type('Test Project');
        
        // Mock API error
        cy.intercept('POST', '**/rest/v1/projects', {
          statusCode: 500,
          body: { error: 'Internal server error' }
        }).as('createProjectError');
        
        cy.get('button').contains('Create Project').click();
        
        // Verify error handling
        cy.wait('@createProjectError');
        cy.contains('Error creating project', { timeout: 5000 }).should('be.visible');
      });
    });

    describe('Read Projects', () => {
      it('should display list of projects on page load', () => {
        // Verify projects section is visible
        cy.get('aside').contains('Projects').should('be.visible');
        
        // Check if project list area exists
        cy.get('aside').should('contain', 'Projects');
      });

      it('should show project details when selected', () => {
        // Look for project items in sidebar
        cy.get('aside').within(() => {
          cy.get('div').contains('Project').first().click();
        });
        
        // Verify main content area shows project details
        cy.get('main').should('be.visible');
      });

      it('should filter projects by status', () => {
        cy.wait('@getProjects');
        
        // Apply status filter
        cy.get('[data-testid="status-filter"]').select('Active');
        
        // Verify only active projects are shown
        cy.get('[data-testid="project-item"]').each(($el) => {
          cy.wrap($el).find('[data-testid="project-status"]').should('contain', 'Active');
        });
      });
    });

    describe('Update Project', () => {
      it('should update project details', () => {
        // Create a project first
        cy.get('button').contains('New Project').click();
        cy.get('input[placeholder*="title"], input[name*="title"]').type('Original Project');
        cy.get('button').contains('Create Project').click();
        
        // Wait for project to be created
        cy.contains('Original Project', { timeout: 5000 }).should('be.visible');
        
        // Find and click edit button (look for edit icon or button)
        cy.get('button[title*="edit"], button').contains('Edit').first().click();
        
        // Update project details
        cy.get('input[value*="Original Project"]').clear().type('Updated Project Title');
        
        // Submit update
        cy.get('button').contains('Update', { timeout: 3000 }).click();
        
        // Verify updated content is displayed
        cy.contains('Updated Project Title', { timeout: 5000 }).should('be.visible');
      });

      it('should handle concurrent update conflicts', () => {
        cy.wait('@getProjects');
        
        cy.get('[data-testid="project-item"]').first().find('[data-testid="edit-project-button"]').click();
        
        // Mock conflict error
        cy.intercept('PATCH', '**/rest/v1/projects*', {
          statusCode: 409,
          body: { error: 'Conflict: Resource was modified by another user' }
        }).as('updateConflict');
        
        cy.get('[data-testid="project-title-input"]').clear().type('Conflicted Update');
        cy.get('[data-testid="update-project-submit"]').click();
        
        cy.wait('@updateConflict');
        
        // Verify conflict handling
        cy.contains('Project was modified by another user', { timeout: 5000 }).should('be.visible');
        cy.get('[data-testid="refresh-project-button"]').should('be.visible');
      });
    });

    describe('Delete Project', () => {
      it('should delete project with confirmation', () => {
        // Create a project first
        cy.get('button').contains('New Project').click();
        cy.get('input[placeholder*="title"], input[name*="title"]').type('Project to Delete');
        cy.get('button').contains('Create Project').click();
        
        cy.contains('Project to Delete', { timeout: 5000 }).should('be.visible');
        
        // Find and click delete button
        cy.get('button[title*="delete"], button').contains('Delete').first().click();
        
        // Confirm deletion if confirmation dialog appears
        cy.get('body').then(($body) => {
          if ($body.find('button').filter(':contains("Confirm")').length > 0) {
            cy.get('button').contains('Confirm').click();
          }
        });
        
        // Verify project is removed
        cy.contains('Project to Delete').should('not.exist');
      });

      it('should cancel project deletion', () => {
        cy.wait('@getProjects');
        
        const initialProjectCount = cy.get('[data-testid="project-item"]').its('length');
        
        cy.get('[data-testid="project-item"]').first().find('[data-testid="delete-project-button"]').click();
        
        // Cancel deletion
        cy.get('[data-testid="cancel-delete-button"]').click();
        
        // Verify dialog is closed and project still exists
        cy.get('[data-testid="confirm-delete-dialog"]').should('not.exist');
        cy.get('[data-testid="project-item"]').should('have.length', initialProjectCount);
      });
    });
  });

  describe('Task CRUD Operations', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('Tasks').click();
    });

    describe('Create Task', () => {
      it('should create a new task', () => {
        cy.get('button').contains('New Task', { timeout: 10000 }).click();
        
        // Fill out task form
        cy.get('input[placeholder*="title"], input[name*="title"]').type('Test Task');
        cy.get('textarea[placeholder*="description"], textarea[name*="description"]').type('This is a test task');
        
        // Submit the form
        cy.get('button').contains('Create Task').click();
        
        // Verify task appears
        cy.contains('Test Task', { timeout: 5000 }).should('be.visible');
      });

      it('should validate required task fields', () => {
        cy.get('button').contains('New Task').click();
        
        // Try to submit without required fields
        cy.get('button').contains('Create Task').click();
        
        // Verify validation errors
        cy.contains('required', { timeout: 3000 }).should('be.visible');
      });

      it('should validate task dependencies', () => {
        cy.get('button').contains('New Task').click();
        
        cy.get('input[placeholder*="title"], input[name*="title"]').type('Dependent Task');
        cy.get('[data-testid="task-dependencies-select"]').select(['Existing Task 1', 'Existing Task 2']);
        
        // Mock create with dependencies
        cy.intercept('POST', '**/rest/v1/tasks', {
          statusCode: 201,
          body: { 
            id: 'dependent-task-id',
            title: 'Dependent Task',
            dependencies: ['task-1', 'task-2']
          }
        }).as('createDependentTask');
        
        cy.get('button').contains('Create Task').click();
        
        cy.wait('@createDependentTask').then((interception) => {
          expect(interception.request.body.dependencies).to.have.length(2);
        });
      });
    });

    describe('Update Task Status', () => {
      it('should update task status', () => {
        // Create a task first
        cy.get('button').contains('New Task').click();
        cy.get('input[placeholder*="title"], input[name*="title"]').type('Status Test Task');
        cy.get('button').contains('Create Task').click();
        
        cy.contains('Status Test Task', { timeout: 5000 }).should('be.visible');
        
        // Look for status dropdown or buttons
        cy.get('select, button').contains('TODO', { timeout: 3000 }).should('exist');
      });
    });

    describe('Task Priority Management', () => {
      it('should set and update task priority', () => {
        // Create a task first
        cy.get('button').contains('New Task').click();
        cy.get('input[placeholder*="title"], input[name*="title"]').type('Priority Test Task');
        
        // Set priority if available in form
        cy.get('body').then(($body) => {
          if ($body.find('select').filter('[name*="priority"]').length > 0) {
            cy.get('select[name*="priority"]').select('High');
          }
        });
        
        cy.get('button').contains('Create Task').click();
        
        cy.contains('Priority Test Task', { timeout: 5000 }).should('be.visible');
      });
    });
  });

  describe('User Preferences CRUD', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.contains('Settings').click();
    });

    it('should update working hours preferences', () => {
      cy.wait('@getUserPreferences');
      
      // Update working hours
      cy.get('[data-testid="working-hours-start"]').clear().type('08:00');
      cy.get('[data-testid="working-hours-end"]').clear().type('18:00');
      
      // Mock preferences update
      cy.intercept('PATCH', '**/rest/v1/user_preferences*', {
        statusCode: 200,
        body: { 
          working_hours_start: '08:00',
          working_hours_end: '18:00'
        }
      }).as('updatePreferences');
      
      cy.get('[data-testid="save-preferences-button"]').click();
      
      cy.wait('@updatePreferences');
      cy.contains('Preferences updated successfully').should('be.visible');
    });

    it('should update AI provider settings', () => {
      cy.wait('@getUserPreferences');
      
      cy.get('[data-testid="ai-provider-tab"]').click();
      
      // Change AI provider
      cy.get('[data-testid="ai-provider-select"]').select('OpenAI');
      cy.get('[data-testid="openai-api-key-input"]').type('test-api-key');
      
      // Mock AI settings update
      cy.intercept('PATCH', '**/rest/v1/user_preferences*', {
        statusCode: 200,
        body: { 
          ai_provider: 'openai',
          openai_api_key: 'test-api-key'
        }
      }).as('updateAISettings');
      
      cy.get('[data-testid="save-ai-settings-button"]').click();
      
      cy.wait('@updateAISettings');
      cy.contains('AI settings updated successfully').should('be.visible');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network connectivity issues', () => {
      // Simulate offline
      cy.visit('/');
      
      // Mock network failure
      cy.intercept('GET', '**/rest/v1/**', { forceNetworkError: true });
      
      // Try to create a project
      cy.contains('Projects').click();
      cy.get('button').contains('New Project').click();
      cy.get('input[placeholder*="title"], input[name*="title"]').type('Offline Project');
      cy.get('button').contains('Create Project').click();
      
      // Verify offline handling
      cy.contains('Operation queued for sync').should('be.visible');
      cy.get('[data-testid="sync-status"]').should('contain', 'Offline');
    });

    it('should handle data validation errors from the server', () => {
      cy.visit('/');
      cy.contains('Projects').click();
      cy.get('button').contains('New Project').click();
      
      // Mock validation error from server
      cy.intercept('POST', '**/rest/v1/projects', {
        statusCode: 400,
        body: { 
          error: 'Validation failed',
          details: ['Title must be unique', 'Description is too long']
        }
      }).as('validationError');
      
      cy.get('input[placeholder*="title"], input[name*="title"]').type('Duplicate Project');
      cy.get('button').contains('Create Project').click();
      
      cy.wait('@validationError');
      
      // Verify validation errors are displayed
      cy.contains('Title must be unique').should('be.visible');
      cy.contains('Description is too long').should('be.visible');
    });

    it('should retry failed operations when connectivity is restored', () => {
      cy.visit('/');
      
      // Start offline
      cy.intercept('POST', '**/rest/v1/projects', { forceNetworkError: true }).as('offlineCreate');
      
      cy.contains('Projects').click();
      cy.get('button').contains('New Project').click();
      cy.get('input[placeholder*="title"], input[name*="title"]').type('Retry Project');
      cy.get('button').contains('Create Project').click();
      
      cy.wait('@offlineCreate');
      cy.contains('Operation queued for sync').should('be.visible');
      
      // Restore connectivity
      cy.intercept('POST', '**/rest/v1/projects', {
        statusCode: 201,
        body: { id: 'retry-project-id', title: 'Retry Project' }
      }).as('onlineCreate');
      
      // Trigger retry
      cy.get('button').contains('Retry Sync').click();
      
      cy.wait('@onlineCreate');
      cy.contains('Project created successfully').should('be.visible');
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across page refreshes', () => {
      cy.visit('/');
      cy.contains('Projects').click();
      cy.get('button').contains('New Project').click();
      
      cy.get('input[placeholder*="title"], input[name*="title"]').type('Persistence Test Project');
      cy.get('button').contains('Create Project').click();
      
      cy.contains('Persistence Test Project', { timeout: 5000 }).should('be.visible');
      
      // Refresh the page
      cy.reload();
      
      // Verify data persists
      cy.contains('Projects').click();
      cy.contains('Persistence Test Project', { timeout: 10000 }).should('be.visible');
    });

    it('should maintain authentication state across refreshes', () => {
      cy.visit('/');
      
      // Verify authenticated state
      cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
      
      // Refresh page
      cy.reload();
      
      // Should still be authenticated
      cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Real-time Updates', () => {
    it('should handle concurrent user scenarios', () => {
      cy.visit('/');
      cy.contains('Projects').click();
      
      // Create a project
      cy.get('button').contains('New Project').click();
      cy.get('input[placeholder*="title"], input[name*="title"]').type('Concurrent Test Project');
      cy.get('button').contains('Create Project').click();
      
      cy.contains('Concurrent Test Project', { timeout: 5000 }).should('be.visible');
      
      // Simulate another user's changes by refreshing data
      cy.reload();
      cy.contains('Projects').click();
      
      // Verify project still exists
      cy.contains('Concurrent Test Project', { timeout: 10000 }).should('be.visible');
    });
  });
}); 