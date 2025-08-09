import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Project, Task, UserPreferences, Tag, TagCategory, Schedule } from '../../types';
import { useCustomAuth } from './CustomAuthContext';
import { adaptiveDatabaseService } from '../../services/adaptiveDatabaseService';
import { 
  tasksService, 
  schedulesService,
  userPreferencesService, 
  tagsService,
  tagCategoriesService,
  subscriptions,
  DatabaseServiceError 
} from '../../services/databaseService';

// Action Types
type AppAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_PROJECTS'; projects: Project[] }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'DELETE_PROJECT'; projectId: string }
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'SET_SCHEDULES'; schedules: Schedule[] }
  | { type: 'ADD_SCHEDULE'; schedule: Schedule }
  | { type: 'UPDATE_SCHEDULE'; schedule: Schedule }
  | { type: 'DELETE_SCHEDULE'; scheduleId: string }
  | { type: 'SET_USER_PREFERENCES'; preferences: UserPreferences }
  | { type: 'UPDATE_USER_PREFERENCES'; preferences: Partial<UserPreferences> }
  | { type: 'SET_TAGS'; tags: Tag[] }
  | { type: 'ADD_TAG'; tag: Tag }
  | { type: 'UPDATE_TAG'; tag: Tag }
  | { type: 'DELETE_TAG'; tagId: string }
  | { type: 'SET_TAG_CATEGORIES'; categories: TagCategory[] }
  | { type: 'ADD_TAG_CATEGORY'; category: TagCategory }
  | { type: 'UPDATE_TAG_CATEGORY'; category: TagCategory }
  | { type: 'DELETE_TAG_CATEGORY'; categoryId: string }
  | { type: 'SET_ONLINE_STATUS'; isOnline: boolean }
  | { type: 'ADD_PENDING_OPERATION'; operation: PendingOperation }
  | { type: 'REMOVE_PENDING_OPERATION'; operationId: string }
  | { type: 'SET_SYNC_STATUS'; status: 'syncing' | 'synced' | 'error' }
  | { type: 'RESET_STATE' };

// Pending Operation for offline support
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'project' | 'task' | 'schedule' | 'userPreferences' | 'tag' | 'tagCategory';
  data: any;
  timestamp: number;
}

// App State Interface
interface AppState {
  // Data
  projects: Project[];
  tasks: Task[];
  schedules: Schedule[];
  userPreferences: UserPreferences | null;
  tags: Tag[];
  tagCategories: TagCategory[];
  
  // UI State
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  syncStatus: 'syncing' | 'synced' | 'error';
  
  // Offline Support
  pendingOperations: PendingOperation[];
}

// Initial State
const initialState: AppState = {
  projects: [],
  tasks: [],
  schedules: [],
  userPreferences: null,
  tags: [],
  tagCategories: [],
  loading: true,
  error: null,
  isOnline: navigator.onLine,
  syncStatus: 'synced',
  pendingOperations: [],
};

// Default User Preferences
const defaultUserPreferences: Omit<UserPreferences, 'id' | 'user_id'> = {
  working_hours_start: "09:00",
  working_hours_end: "17:00",
  focus_block_duration: 90,
  break_duration: 15,
  priority_weight_deadline: 0.4,
  priority_weight_effort: 0.3,
  priority_weight_deps: 0.3,
  instructions: "Default user instructions.",
  business_hours_start: "09:00",
  business_hours_end: "17:00",
  business_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  personal_time_weekday_evening: true,
  personal_time_weekends: true,
  personal_time_early_morning: false,
  allow_business_in_personal_time: false,
  allow_personal_in_business_time: false,
  context_switch_buffer_minutes: 30,
  ai_provider: 'claude',
  selected_gemini_model: '', // deprecated
  claude_api_key: '',
  openai_api_key: '',
  focus_blocks: ["Mon 10-12", "Wed 2-4"],
  preferred_time_slots: ["Morning (9-12)"],
  business_relevance_default: 70,
};

// Reducer
function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.projects };
    
    case 'ADD_PROJECT':
      return { 
        ...state, 
        projects: [action.project, ...state.projects] 
      };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.project.id ? action.project : p
        )
      };
    
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.projectId),
        tasks: state.tasks.filter(t => t.project_id !== action.projectId)
      };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.tasks };
    
    case 'ADD_TASK':
      return { 
        ...state, 
        tasks: [action.task, ...state.tasks] 
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => 
          t.id === action.task.id ? action.task : t
        )
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.taskId)
      };
    
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.schedules };
    
    case 'ADD_SCHEDULE':
      return { 
        ...state, 
        schedules: [action.schedule, ...state.schedules] 
      };
    
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map(s => 
          s.id === action.schedule.id ? action.schedule : s
        )
      };
    
    case 'DELETE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.filter(s => s.id !== action.scheduleId)
      };
    
    case 'SET_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: action.preferences
      };
    
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: action.preferences && state.userPreferences ? { ...state.userPreferences, ...action.preferences } : state.userPreferences
      };
    
    case 'SET_TAGS':
      return { ...state, tags: action.tags };
    
    case 'ADD_TAG':
      return { 
        ...state, 
        tags: [action.tag, ...state.tags] 
      };
    
    case 'UPDATE_TAG':
      return {
        ...state,
        tags: state.tags.map(t => 
          t.id === action.tag.id ? action.tag : t
        )
      };
    
    case 'DELETE_TAG':
      return {
        ...state,
        tags: state.tags.filter(t => t.id !== action.tagId)
      };
    
    case 'SET_TAG_CATEGORIES':
      return { ...state, tagCategories: action.categories };
    
    case 'ADD_TAG_CATEGORY':
      return { 
        ...state, 
        tagCategories: [action.category, ...state.tagCategories] 
      };
    
    case 'UPDATE_TAG_CATEGORY':
      return {
        ...state,
        tagCategories: state.tagCategories.map(c => 
          c.id === action.category.id ? action.category : c
        )
      };
    
    case 'DELETE_TAG_CATEGORY':
      return {
        ...state,
        tagCategories: state.tagCategories.filter(c => c.id !== action.categoryId)
      };
    
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.isOnline };
    
    case 'ADD_PENDING_OPERATION':
      return {
        ...state,
        pendingOperations: [...state.pendingOperations, action.operation]
      };
    
    case 'REMOVE_PENDING_OPERATION':
      return {
        ...state,
        pendingOperations: state.pendingOperations.filter(op => op.id !== action.operationId)
      };
    
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.status };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context Type
interface AppStateContextType {
  state: AppState;
  
  // Actions
  loadInitialData: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Project Actions
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Schedule Actions
  addSchedule: (schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Schedule>;
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  
  // User Preferences Actions
  updateUserPreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  
  // Tag Actions
  addTag: (tag: Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  
  // Tag Category Actions
  addTagCategory: (category: Omit<TagCategory, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<TagCategory>;
  updateTagCategory: (id: string, updates: Partial<TagCategory>) => Promise<void>;
  deleteTagCategory: (id: string) => Promise<void>;
  
  // Utility Actions
  clearError: () => void;
  syncPendingOperations: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Provider Component
interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  const { user, isAuthenticated } = useCustomAuth();

  // Utility function to generate operation IDs
  const generateOperationId = () => `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Optimistic update with fallback
  const performOptimisticUpdate = async (
    optimisticAction: AppAction,
    rollbackAction: AppAction,
    operation: () => Promise<any>
  ): Promise<any> => {
    // Apply optimistic update
    dispatch(optimisticAction);
    
    try {
      const result = await operation();
      return result;
    } catch (error) {
      // Rollback on error
      dispatch(rollbackAction);
      throw error;
    }
  };

  // Handle offline operations
  const handleOfflineOperation = (operation: PendingOperation) => {
    if (!state.isOnline) {
      dispatch({ type: 'ADD_PENDING_OPERATION', operation });
      return true;
    }
    return false;
  };

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    
    try {
      const [projects, tasks, schedules, preferences, tags, categories] = await Promise.all([
        adaptiveDatabaseService.getAllProjects(),
        tasksService.getAll(),
        schedulesService.getAll(),
        userPreferencesService.get(),
        tagsService.getAll(),
        tagCategoriesService.getAll()
      ]);

      dispatch({ type: 'SET_PROJECTS', projects });
      dispatch({ type: 'SET_TASKS', tasks });
      dispatch({ type: 'SET_SCHEDULES', schedules });
      dispatch({ type: 'SET_TAGS', tags });
      dispatch({ type: 'SET_TAG_CATEGORIES', categories });
      
      if (preferences) {
        dispatch({ type: 'SET_USER_PREFERENCES', preferences });
      } else {
        // Create default preferences with enhanced retry logic for foreign key constraint
        let retryCount = 0;
        const maxRetries = 3;
        let preferencesCreated = false;
        
        while (!preferencesCreated && retryCount < maxRetries) {
          try {
            console.log(`🔄 Attempting to create user preferences (attempt ${retryCount + 1}/${maxRetries})...`);
            // Directly upsert without querying public.users (RLS blocks that and Supabase Auth is canonical)
            const newPreferences = await userPreferencesService.upsert(defaultUserPreferences);
            dispatch({ type: 'SET_USER_PREFERENCES', preferences: newPreferences });
            preferencesCreated = true;
            console.log('✅ User preferences created/updated successfully');
          } catch (prefError: any) {
            console.warn(`❌ Failed to create user preferences (attempt ${retryCount + 1}):`, prefError?.message || prefError);
            
            // If foreign key constraint error, retry with exponential backoff
            if (prefError?.message?.includes('foreign key constraint') || prefError?.message?.includes('violates foreign key')) {
              if (retryCount < maxRetries - 1) {
                const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s, 4s
                console.log(`🔄 Retrying user preferences creation in ${delay}ms due to foreign key constraint error...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retryCount++;
              } else {
                console.error('❌ Failed to create user preferences after all retries due to foreign key constraint');
                break;
              }
            } else {
              // Non-foreign key error, don't retry
              console.error('❌ Failed to create user preferences due to non-foreign key error:', prefError?.message || prefError);
              break;
            }
          }
        }
        
        if (!preferencesCreated) {
          console.warn('⚠️ Continuing without user preferences - app functionality may be limited');
          // Set loading to false even if preferences creation failed
          dispatch({ type: 'SET_LOADING', loading: false });
        }
      }
      
      dispatch({ type: 'SET_SYNC_STATUS', status: 'synced' });
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      const errorMessage = error instanceof DatabaseServiceError 
        ? `Database Error: ${error.message}` 
        : `Failed to load data: ${error.message || 'Unknown error'}`;
      dispatch({ type: 'SET_ERROR', error: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, [isAuthenticated]);

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    await loadInitialData();
  }, [isAuthenticated, loadInitialData]);

  // Project Actions
  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Project> => {
    const tempId = `temp_${Date.now()}`;
    const tempProject: Project = {
      id: tempId,
      ...projectData,
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const operationId = generateOperationId();
    if (handleOfflineOperation({
      id: operationId,
      type: 'create',
      entity: 'project',
      data: projectData,
      timestamp: Date.now()
    })) {
      dispatch({ type: 'ADD_PROJECT', project: tempProject });
      return tempProject;
    }

    try {
      // Apply optimistic update first
      dispatch({ type: 'ADD_PROJECT', project: tempProject });
      
      // Create the project in database
      const createdProject = await adaptiveDatabaseService.createProject(projectData);
      console.log('Project created successfully:', createdProject);
      
      // Replace the temporary project with the real one
      dispatch({ type: 'DELETE_PROJECT', projectId: tempId });
      dispatch({ type: 'ADD_PROJECT', project: createdProject });
      
      return createdProject;
    } catch (error) {
      // Rollback on error - remove the temporary project
      console.error('Error creating project:', error);
      dispatch({ type: 'DELETE_PROJECT', projectId: tempId });
      throw error;
    }
  }, [user?.id, state.isOnline]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>): Promise<void> => {
    const originalProject = state.projects.find(p => p.id === id);
    if (!originalProject) throw new Error('Project not found');

    const updatedProject = { ...originalProject, ...updates };

    await performOptimisticUpdate(
      { type: 'UPDATE_PROJECT', project: updatedProject },
      { type: 'UPDATE_PROJECT', project: originalProject },
      async () => {
        const result = await adaptiveDatabaseService.updateProject(id, updates);
        dispatch({ type: 'UPDATE_PROJECT', project: result });
      }
    );
  }, [state.projects]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    const projectToDelete = state.projects.find(p => p.id === id);
    if (!projectToDelete) return;

    await performOptimisticUpdate(
      { type: 'DELETE_PROJECT', projectId: id },
      { type: 'ADD_PROJECT', project: projectToDelete },
      async () => {
        await adaptiveDatabaseService.deleteProject(id);
      }
    );
  }, [state.projects]);

  // Task Actions
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Task> => {
    const tempId = `temp_${Date.now()}`;
    const tempTask: Task = {
      id: tempId,
      ...taskData,
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Validate project_id if provided
    if (taskData.project_id) {
      const project = state.projects.find(p => p.id === taskData.project_id);
      if (!project) {
        throw new Error('Selected project does not exist');
      }
      if (project.id.startsWith('temp_')) {
        throw new Error('Cannot create task for unsaved project. Please wait for the project to be saved first.');
      }
    }

    try {
      // Apply optimistic update first
      dispatch({ type: 'ADD_TASK', task: tempTask });
      
      // Create the task in database
      const createdTask = await tasksService.create(taskData);
      console.log('Task created successfully:', createdTask);
      
      // Replace the temporary task with the real one
      dispatch({ type: 'DELETE_TASK', taskId: tempId });
      dispatch({ type: 'ADD_TASK', task: createdTask });
      
      return createdTask;
    } catch (error) {
      // Rollback on error - remove the temporary task
      console.error('Error creating task:', error);
      dispatch({ type: 'DELETE_TASK', taskId: tempId });
      throw error;
    }
  }, [user?.id, state.projects]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<void> => {
    const originalTask = state.tasks.find(t => t.id === id);
    if (!originalTask) throw new Error('Task not found');

    const updatedTask = { ...originalTask, ...updates };

    await performOptimisticUpdate(
      { type: 'UPDATE_TASK', task: updatedTask },
      { type: 'UPDATE_TASK', task: originalTask },
      async () => {
        const result = await tasksService.update(id, updates);
        dispatch({ type: 'UPDATE_TASK', task: result });
      }
    );
  }, [state.tasks]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    const taskToDelete = state.tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    await performOptimisticUpdate(
      { type: 'DELETE_TASK', taskId: id },
      { type: 'ADD_TASK', task: taskToDelete },
      async () => {
        await tasksService.delete(id);
      }
    );
  }, [state.tasks]);

  // Schedule Actions
  const addSchedule = useCallback(async (scheduleData: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Schedule> => {
    const tempId = `temp_${Date.now()}`;
    const tempSchedule: Schedule = {
      id: tempId,
      ...scheduleData,
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Validate task_id if provided (schedules link to tasks, not projects)
    if (scheduleData.task_id) {
      const task = state.tasks.find(t => t.id === scheduleData.task_id);
      if (!task) {
        throw new Error('Selected task does not exist');
      }
      if (task.id.startsWith('temp_')) {
        throw new Error('Cannot create schedule for unsaved task. Please wait for the task to be saved first.');
      }
    }

    try {
      // Apply optimistic update first
      dispatch({ type: 'ADD_SCHEDULE', schedule: tempSchedule });
      
      // Create the schedule in database
      const createdSchedule = await schedulesService.create(scheduleData);
      console.log('Schedule created successfully:', createdSchedule);
      
      // Replace the temporary schedule with the real one
      dispatch({ type: 'DELETE_SCHEDULE', scheduleId: tempId });
      dispatch({ type: 'ADD_SCHEDULE', schedule: createdSchedule });
      
      return createdSchedule;
    } catch (error) {
      // Rollback on error - remove the temporary schedule
      console.error('Error creating schedule:', error);
      dispatch({ type: 'DELETE_SCHEDULE', scheduleId: tempId });
      throw error;
    }
  }, [user?.id, state.projects]);

  const updateSchedule = useCallback(async (id: string, updates: Partial<Schedule>): Promise<void> => {
    const originalSchedule = state.schedules.find(s => s.id === id);
    if (!originalSchedule) {
      console.error('❌ Schedule not found:', id);
      throw new Error('Schedule not found');
    }

    const updatedSchedule = { ...originalSchedule, ...updates };

    await performOptimisticUpdate(
      { type: 'UPDATE_SCHEDULE', schedule: updatedSchedule },
      { type: 'UPDATE_SCHEDULE', schedule: originalSchedule },
      async () => {
        const result = await schedulesService.update(id, updates);
        dispatch({ type: 'UPDATE_SCHEDULE', schedule: result });
      }
    );
  }, [state.schedules]);

  const deleteSchedule = useCallback(async (id: string): Promise<void> => {
    const scheduleToDelete = state.schedules.find(s => s.id === id);
    if (!scheduleToDelete) return;

    await performOptimisticUpdate(
      { type: 'DELETE_SCHEDULE', scheduleId: id },
      { type: 'ADD_SCHEDULE', schedule: scheduleToDelete },
      async () => {
        await schedulesService.delete(id);
      }
    );
  }, [state.schedules]);

  // User Preferences Actions
  const updateUserPreferences = useCallback(async (updates: Partial<UserPreferences>): Promise<void> => {
    if (!state.userPreferences) return;

    // const updatedPreferences = { ...state.userPreferences, ...updates };

    await performOptimisticUpdate(
      { type: 'UPDATE_USER_PREFERENCES', preferences: updates },
      { type: 'SET_USER_PREFERENCES', preferences: state.userPreferences },
      async () => {
        const result = await userPreferencesService.update(updates);
        dispatch({ type: 'SET_USER_PREFERENCES', preferences: result });
      }
    );
  }, [state.userPreferences]);

  // Tag Actions
  const addTag = useCallback(async (tagData: Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Tag> => {
    const tempId = `temp_${Date.now()}`;
    const tempTag: Tag = {
      id: tempId,
      ...tagData,
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await performOptimisticUpdate(
      { type: 'ADD_TAG', tag: tempTag },
      { type: 'DELETE_TAG', tagId: tempId },
      async () => {
        const createdTag = await tagsService.create(tagData);
        dispatch({ type: 'UPDATE_TAG', tag: createdTag });
        return createdTag;
      }
    );
  }, [user?.id]);

  const updateTag = useCallback(async (id: string, updates: Partial<Tag>): Promise<void> => {
    const originalTag = state.tags.find(t => t.id === id);
    if (!originalTag) throw new Error('Tag not found');

    const updatedTag = { ...originalTag, ...updates };

    await performOptimisticUpdate(
      { type: 'UPDATE_TAG', tag: updatedTag },
      { type: 'UPDATE_TAG', tag: originalTag },
      async () => {
        const result = await tagsService.update(id, updates);
        dispatch({ type: 'UPDATE_TAG', tag: result });
      }
    );
  }, [state.tags]);

  const deleteTag = useCallback(async (id: string): Promise<void> => {
    const tagToDelete = state.tags.find(t => t.id === id);
    if (!tagToDelete) return;

    await performOptimisticUpdate(
      { type: 'DELETE_TAG', tagId: id },
      { type: 'ADD_TAG', tag: tagToDelete },
      async () => {
        await tagsService.delete(id);
      }
    );
  }, [state.tags]);

  // Tag Category Actions
  const addTagCategory = useCallback(async (categoryData: Omit<TagCategory, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<TagCategory> => {
    const tempId = `temp_${Date.now()}`;
    const tempCategory: TagCategory = {
      id: tempId,
      ...categoryData,
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await performOptimisticUpdate(
      { type: 'ADD_TAG_CATEGORY', category: tempCategory },
      { type: 'DELETE_TAG_CATEGORY', categoryId: tempId },
      async () => {
        const createdCategory = await tagCategoriesService.create(categoryData);
        dispatch({ type: 'UPDATE_TAG_CATEGORY', category: createdCategory });
        return createdCategory;
      }
    );
  }, [user?.id]);

  const updateTagCategory = useCallback(async (id: string, updates: Partial<TagCategory>): Promise<void> => {
    const originalCategory = state.tagCategories.find(c => c.id === id);
    if (!originalCategory) throw new Error('Tag category not found');

    const updatedCategory = { ...originalCategory, ...updates };

    await performOptimisticUpdate(
      { type: 'UPDATE_TAG_CATEGORY', category: updatedCategory },
      { type: 'UPDATE_TAG_CATEGORY', category: originalCategory },
      async () => {
        const result = await tagCategoriesService.update(id, updates);
        dispatch({ type: 'UPDATE_TAG_CATEGORY', category: result });
      }
    );
  }, [state.tagCategories]);

  const deleteTagCategory = useCallback(async (id: string): Promise<void> => {
    const categoryToDelete = state.tagCategories.find(c => c.id === id);
    if (!categoryToDelete) return;

    await performOptimisticUpdate(
      { type: 'DELETE_TAG_CATEGORY', categoryId: id },
      { type: 'ADD_TAG_CATEGORY', category: categoryToDelete },
      async () => {
        await tagCategoriesService.delete(id);
      }
    );
  }, [state.tagCategories]);

  // Utility Actions
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  const syncPendingOperations = useCallback(async (): Promise<void> => {
    if (state.pendingOperations.length === 0) return;

    dispatch({ type: 'SET_SYNC_STATUS', status: 'syncing' });

    try {
      for (const operation of state.pendingOperations) {
        // Execute pending operations
        // This is a simplified implementation
        dispatch({ type: 'REMOVE_PENDING_OPERATION', operationId: operation.id });
      }
      dispatch({ type: 'SET_SYNC_STATUS', status: 'synced' });
    } catch (error) {
      dispatch({ type: 'SET_SYNC_STATUS', status: 'error' });
    }
  }, [state.pendingOperations]);

  // Effects
  
  // Load initial data when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    } else {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [isAuthenticated]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;

    const setupSubscriptions = async () => {
      await subscriptions.subscribeToProjects((payload) => {
        console.log('Real-time project change:', payload);
        if (payload.eventType === 'INSERT') {
          dispatch({ type: 'ADD_PROJECT', project: payload.new });
        } else if (payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_PROJECT', project: payload.new });
        } else if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_PROJECT', projectId: payload.old.id });
        }
      });

      await subscriptions.subscribeToTasks((payload) => {
        console.log('Real-time task change:', payload);
        if (payload.eventType === 'INSERT') {
          dispatch({ type: 'ADD_TASK', task: payload.new });
        } else if (payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_TASK', task: payload.new });
        } else if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_TASK', taskId: payload.old.id });
        }
      });

      return () => {
        subscriptions.unsubscribe('projects_subscription');
        subscriptions.unsubscribe('tasks_subscription');
      };
    };

    setupSubscriptions();
  }, [isAuthenticated]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', isOnline: true });
      syncPendingOperations();
    };
    
    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', isOnline: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingOperations]);

  const value: AppStateContextType = {
    state,
    loadInitialData,
    refreshData,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    updateUserPreferences,
    addTag,
    updateTag,
    deleteTag,
    addTagCategory,
    updateTagCategory,
    deleteTagCategory,
    clearError,
    syncPendingOperations,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook to use the context
export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}; 