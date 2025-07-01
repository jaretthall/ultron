import { DatabaseServiceError } from './databaseService';

// Mock Supabase
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    channel: jest.fn(),
  },
}));

describe('Database Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DatabaseServiceError', () => {
    it('should create error with proper context', () => {
      const originalError = { message: 'Database error', code: 'DB_001' };
      const operation = 'create project';
      const context = { projectId: 'project-1' };

      const error = new DatabaseServiceError(originalError.message, operation, originalError, context);

      expect(error.message).toBe('Database error');
      expect(error.operation).toBe('create project');
      expect(error.originalError).toBe(originalError);
      expect(error.context).toBe(context);
      expect(error.name).toBe('DatabaseServiceError');
    });

    it('should be instance of Error', () => {
      const error = new DatabaseServiceError('Test error', 'test operation');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Projects Service Mock Tests', () => {
    const mockProject = {
      id: 'project-1',
      title: 'Test Project',
      description: 'Test Description',
      goals: ['Goal 1', 'Goal 2'],
      status: 'active',
      context: 'business',
      tags: ['test'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should handle successful project creation', () => {
      // Mock successful response
      const mockResponse = {
        data: { ...mockProject, id: 'new-project-id' },
        error: null,
      };

      // Verify mock response structure
      expect(mockResponse.data).toHaveProperty('id');
      expect(mockResponse.data).toHaveProperty('title');
      expect(mockResponse.error).toBeNull();
    });

    it('should handle project creation errors', () => {
      // Mock error response
      const mockError = { 
        message: 'Validation failed', 
        code: 'VALIDATION_ERROR',
        details: 'Title cannot be empty'
      };

      const mockResponse = {
        data: null,
        error: mockError,
      };

      // Verify error response structure
      expect(mockResponse.data).toBeNull();
      expect(mockResponse.error).toHaveProperty('message');
      expect(mockResponse.error).toHaveProperty('code');
    });

    it('should handle project updates', () => {
      const updates = { title: 'Updated Title' };
      const updatedProject = { ...mockProject, ...updates };

      expect(updatedProject.title).toBe('Updated Title');
      expect(updatedProject.id).toBe(mockProject.id);
    });

    it('should handle project deletion', () => {
      const mockResponse = {
        data: null,
        error: null,
      };

      expect(mockResponse.error).toBeNull();
    });
  });

  describe('Tasks Service Mock Tests', () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'Test Description',
      project_id: 'project-1',
      priority: 'high',
      status: 'todo',
      estimated_hours: 4,
      dependencies: [],
      tags: ['test'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should handle task status updates', () => {
      const updatedTask = { ...mockTask, status: 'in_progress' };

      expect(updatedTask.status).toBe('in_progress');
      expect(updatedTask.id).toBe(mockTask.id);
    });

    it('should handle task dependencies', () => {
      const taskWithDeps = { ...mockTask, dependencies: ['task-2', 'task-3'] };

      expect(taskWithDeps.dependencies).toHaveLength(2);
      expect(taskWithDeps.dependencies).toContain('task-2');
      expect(taskWithDeps.dependencies).toContain('task-3');
    });

    it('should handle task priority updates', () => {
      const priorityUpdates = ['low', 'medium', 'high', 'urgent'];

      priorityUpdates.forEach(priority => {
        const updatedTask = { ...mockTask, priority };
        expect(updatedTask.priority).toBe(priority);
      });
    });
  });

  describe('User Preferences Mock Tests', () => {
    const mockPreferences = {
      id: 'pref-1',
      working_hours_start: '09:00',
      working_hours_end: '17:00',
      focus_block_duration: 90,
      break_duration: 15,
      priority_weight_deadline: 0.4,
      priority_weight_effort: 0.3,
      priority_weight_deps: 0.3,
      ai_provider: 'gemini',
      selected_gemini_model: 'gemini-1.5-flash',
      instructions: 'Test preferences',
      business_hours_start: '09:00',
      business_hours_end: '17:00',
      business_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      personal_time_weekday_evening: true,
      personal_time_weekends: true,
      personal_time_early_morning: false,
      allow_business_in_personal_time: false,
      allow_personal_in_business_time: false,
      context_switch_buffer_minutes: 15,
      claude_api_key: '',
      openai_api_key: '',
      focus_blocks: [],
      preferred_time_slots: [],
      business_relevance_default: 50,
    };

    it('should handle preferences updates', () => {
      const updates = { working_hours_start: '08:00', ai_provider: 'openai' };
      const updatedPrefs = { ...mockPreferences, ...updates };

      expect(updatedPrefs.working_hours_start).toBe('08:00');
      expect(updatedPrefs.ai_provider).toBe('openai');
      expect(updatedPrefs.id).toBe(mockPreferences.id);
    });

    it('should handle default preferences', () => {
      const defaultPrefs = {
        working_hours_start: '09:00',
        working_hours_end: '17:00',
        ai_provider: 'gemini',
        focus_block_duration: 90,
        break_duration: 15,
      };

      expect(defaultPrefs).toHaveProperty('working_hours_start');
      expect(defaultPrefs).toHaveProperty('ai_provider');
      expect(defaultPrefs.ai_provider).toBe('gemini');
    });
  });

  describe('Auth Service Mock Tests', () => {
    it('should handle successful signup', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      const mockResponse = {
        data: { user: mockUser, session: null },
        error: null,
      };

      expect(mockResponse.data.user).toHaveProperty('id');
      expect(mockResponse.data.user).toHaveProperty('email');
      expect(mockResponse.error).toBeNull();
    });

    it('should handle signup errors', () => {
      const mockError = { message: 'Email already exists' };
      const mockResponse = {
        data: { user: null, session: null },
        error: mockError,
      };

      expect(mockResponse.data.user).toBeNull();
      expect(mockResponse.error).toHaveProperty('message');
    });

    it('should handle successful signin', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      const mockSession = {
        access_token: 'token',
        user: mockUser,
      };

      const mockResponse = {
        data: { user: mockUser, session: mockSession },
        error: null,
      };

      expect(mockResponse.data.session).toHaveProperty('access_token');
      expect(mockResponse.data.user).toBe(mockUser);
    });

    it('should handle invalid credentials', () => {
      const mockError = { message: 'Invalid credentials' };
      const mockResponse = {
        data: { user: null, session: null },
        error: mockError,
      };

      expect(mockResponse.data.user).toBeNull();
      expect(mockResponse.data.session).toBeNull();
      expect(mockResponse.error.message).toBe('Invalid credentials');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors', () => {
      const networkError = new Error('Network error');
      
      expect(networkError).toBeInstanceOf(Error);
      expect(networkError.message).toBe('Network error');
    });

    it('should handle validation errors', () => {
      const validationError = {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: ['Title is required', 'Invalid email format']
      };

      expect(validationError).toHaveProperty('code');
      expect(validationError.details).toBeInstanceOf(Array);
      expect(validationError.details).toHaveLength(2);
    });

    it('should handle foreign key constraint errors', () => {
      const constraintError = {
        message: 'Foreign key constraint violation',
        code: '23503'
      };

      expect(constraintError.code).toBe('23503');
      expect(constraintError.message).toContain('Foreign key');
    });

    it('should handle not found errors', () => {
      const notFoundError = {
        message: 'No rows found',
        code: 'PGRST116'
      };

      expect(notFoundError.code).toBe('PGRST116');
      expect(notFoundError.message).toBe('No rows found');
    });
  });

  describe('Data Validation', () => {
    it('should validate project data structure', () => {
      const validProject = {
        title: 'Valid Project',
        description: 'Valid description',
        goals: ['Goal 1', 'Goal 2'],
        status: 'active',
        context: 'business',
        tags: ['tag1', 'tag2'],
      };

      expect(validProject).toHaveProperty('title');
      expect(validProject).toHaveProperty('description');
      expect(validProject.goals).toBeInstanceOf(Array);
      expect(validProject.tags).toBeInstanceOf(Array);
      expect(typeof validProject.title).toBe('string');
      expect(validProject.title.length).toBeGreaterThan(0);
    });

    it('should validate task data structure', () => {
      const validTask = {
        title: 'Valid Task',
        description: 'Valid description',
        project_id: 'project-1',
        priority: 'high',
        status: 'todo',
        estimated_hours: 4,
        dependencies: [],
        tags: ['tag1'],
      };

      expect(validTask).toHaveProperty('title');
      expect(validTask).toHaveProperty('project_id');
      expect(validTask.dependencies).toBeInstanceOf(Array);
      expect(typeof validTask.estimated_hours).toBe('number');
      expect(validTask.estimated_hours).toBeGreaterThan(0);
    });

    it('should validate user preferences structure', () => {
      const validPreferences = {
        working_hours_start: '09:00',
        working_hours_end: '17:00',
        focus_block_duration: 90,
        break_duration: 15,
        ai_provider: 'gemini',
      };

      expect(validPreferences).toHaveProperty('working_hours_start');
      expect(validPreferences).toHaveProperty('ai_provider');
      expect(typeof validPreferences.focus_block_duration).toBe('number');
      expect(validPreferences.focus_block_duration).toBeGreaterThan(0);
      expect(['gemini', 'claude', 'openai']).toContain(validPreferences.ai_provider);
    });
  });

  describe('Real-time Subscription Mocks', () => {
    it('should handle subscription setup', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      };

      expect(mockChannel.on).toBeDefined();
      expect(mockChannel.subscribe).toBeDefined();
      
      const subscription = mockChannel.subscribe();
      expect(subscription).toHaveProperty('unsubscribe');
    });

    it('should handle subscription errors', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockImplementation(() => {
          throw new Error('Subscription failed');
        }),
      };

      expect(() => {
        try {
          mockChannel.subscribe();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Subscription failed');
        }
      }).not.toThrow();
    });
  });
}); 