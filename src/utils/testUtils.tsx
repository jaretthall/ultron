import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { mockUser, mockSession } from '../../setupTests';
import { 
  Project, 
  Task, 
  UserPreferences, 
  Tag, 
  TagCategory,
  ProjectStatus,
  ProjectContext,
  TaskPriority,
  TaskStatus
} from '../../types';

// Mock data for testing
export const mockProjects: Project[] = [
  {
    id: 'project-1',
    title: 'Test Project 1',
    description: 'First test project',
    goals: ['Goal 1', 'Goal 2'],
    status: ProjectStatus.ACTIVE,
    context: ProjectContext.BUSINESS,
    tags: ['test', 'project'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'project-2',
    title: 'Test Project 2',
    description: 'Second test project',
    goals: ['Goal 3'],
    status: ProjectStatus.ON_HOLD,
    project_context: ProjectContext.PERSONAL,
    context: ProjectContext.PERSONAL,
    tags: ['test'],
    deadline: '2025-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Test Task 1',
    description: 'First test task',
    project_id: 'project-1',
    priority: TaskPriority.HIGH,
    status: TaskStatus.TODO,
    estimated_hours: 2,
    dependencies: [],
    tags: ['test', 'urgent'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Test Task 2',
    project_id: 'project-1',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.IN_PROGRESS,
    estimated_hours: 4,
    dependencies: ['task-1'],
    tags: ['test'],
    due_date: '2025-02-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockUserPreferences: UserPreferences = {
  id: 'pref-1',
  user_id: 'user-1',
  working_hours_start: '09:00',
  working_hours_end: '17:00',
  focus_block_duration: 90,
  break_duration: 15,
  priority_weight_deadline: 0.4,
  priority_weight_effort: 0.3,
  priority_weight_deps: 0.3,
  ai_provider: 'gemini',
  selected_gemini_model: 'gemini-1.5-flash',
  instructions: 'Test user preferences',
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

export const mockTags: Tag[] = [
  {
    id: 'tag-1',
    name: 'test',
    color: 'blue',
    category_id: 'category-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tag-2',
    name: 'urgent',
    color: 'red',
    category_id: 'category-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockTagCategories: TagCategory[] = [
  {
    id: 'category-1',
    name: 'General',
    label: 'General Category',
    color: 'gray',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Simplified mock context types to avoid circular dependencies
export interface MockAuthContextType {
  user: any;
  session: any;
  loading: boolean;
  signUp: jest.MockedFunction<any>;
  signIn: jest.MockedFunction<any>;
  signOut: jest.MockedFunction<any>;
  isAuthenticated: boolean;
}

export interface MockAppStateContextType {
  state: {
    projects: Project[];
    tasks: Task[];
    userPreferences: UserPreferences | null;
    tags: Tag[];
    tagCategories: TagCategory[];
    loading: boolean;
    error: string | null;
    isOnline: boolean;
    syncStatus: 'syncing' | 'synced' | 'error';
    pendingOperations: any[];
  };
  addProject: jest.MockedFunction<any>;
  updateProject: jest.MockedFunction<any>;
  deleteProject: jest.MockedFunction<any>;
  addTask: jest.MockedFunction<any>;
  updateTask: jest.MockedFunction<any>;
  deleteTask: jest.MockedFunction<any>;
  updateUserPreferences: jest.MockedFunction<any>;
  addTag: jest.MockedFunction<any>;
  updateTag: jest.MockedFunction<any>;
  deleteTag: jest.MockedFunction<any>;
  addTagCategory: jest.MockedFunction<any>;
  updateTagCategory: jest.MockedFunction<any>;
  deleteTagCategory: jest.MockedFunction<any>;
  clearError: jest.MockedFunction<any>;
  syncPendingOperations: jest.MockedFunction<any>;
}

// Mock contexts
export const mockAuthContext: MockAuthContextType = {
  user: mockUser,
  session: mockSession,
  loading: false,
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  isAuthenticated: true,
};

export const mockAppStateContext: MockAppStateContextType = {
  state: {
    projects: mockProjects,
    tasks: mockTasks,
    userPreferences: mockUserPreferences,
    tags: mockTags,
    tagCategories: mockTagCategories,
    loading: false,
    error: null,
    isOnline: true,
    syncStatus: 'synced',
    pendingOperations: [],
  },
  addProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  addTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  updateUserPreferences: jest.fn(),
  addTag: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn(),
  addTagCategory: jest.fn(),
  updateTagCategory: jest.fn(),
  deleteTagCategory: jest.fn(),
  clearError: jest.fn(),
  syncPendingOperations: jest.fn(),
};

// Simple render function with router wrapper
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

export const renderWithRouter = (
  ui: ReactElement,
  { initialEntries = ['/'], ...renderOptions }: CustomRenderOptions = {}
) => {
  const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );

  return render(ui, { wrapper: RouterWrapper, ...renderOptions });
};

// Database testing utilities
export const mockSupabaseTable = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  then: jest.fn(),
};

export const createMockSupabaseResponse = (data: any = [], error: any = null) => ({
  data,
  error,
});

// Auth testing utilities
export const mockAuthenticatedUser = {
  ...mockUser,
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: null,
  confirmation_sent_at: null,
  recovery_sent_at: null,
  email_change_sent_at: null,
  new_email: null,
  invited_at: null,
  action_link: null,
  email: 'test@example.com',
  phone: null,
  role: 'authenticated',
  last_sign_in_at: new Date().toISOString(),
};

export const mockUnauthenticatedState = {
  user: null,
  session: null,
  loading: false,
};

// Error testing utilities
export const createMockError = (message: string, code?: string) => ({
  message,
  code,
  details: null,
  hint: null,
});

// Async testing utilities
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event'; 