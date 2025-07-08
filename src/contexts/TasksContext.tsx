/**
 * Tasks Context - Focused context for task management
 * Part of Phase 3 performance optimization to reduce unnecessary re-renders
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Task, TaskStatus } from '../../types';
import { useCustomAuth } from './CustomAuthContext';
import { adaptiveDatabaseService } from '../../services/adaptiveDatabaseService';
import { tasksService, subscriptions } from '../../services/databaseService';
import { performanceMonitor } from '../utils/performanceMonitoring';

// Action Types
type TaskAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; task: Task }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'RESET_STATE' };

// State Interface
interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

// Context Interface
interface TasksContextType {
  state: TasksState;
  actions: {
    loadTasks: () => Promise<void>;
    createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Task>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
    deleteTask: (id: string) => Promise<void>;
    refreshTasks: () => Promise<void>;
    clearError: () => void;
  };
}

// Initial State
const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null
};

// Reducer
function tasksReducer(state: TasksState, action: TaskAction): TasksState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.tasks, loading: false, error: null };
    
    case 'ADD_TASK':
      return { 
        ...state, 
        tasks: [action.task, ...state.tasks],
        loading: false,
        error: null 
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => 
          t.id === action.task.id ? action.task : t
        ),
        loading: false,
        error: null
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.taskId),
        loading: false,
        error: null
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Create Context
const TasksContext = createContext<TasksContextType | undefined>(undefined);

// Provider Component
export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tasksReducer, initialState);
  const { user, isAuthenticated } = useCustomAuth();

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    dispatch({ type: 'SET_LOADING', loading: true });
    
    try {
      performanceMonitor.trackComponentRender('TasksProvider.loadTasks', performance.now(), false, false);
      
      const tasks = await tasksService.getAll();
      dispatch({ type: 'SET_TASKS', tasks });
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to load tasks' });
    }
  }, [isAuthenticated, user]);

  // Create task
  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', loading: true });
    
    try {
      const task = await tasksService.create(taskData);
      dispatch({ type: 'ADD_TASK', task });
      return task;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to create task' });
      throw error;
    }
  }, [isAuthenticated]);

  // Update task
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', loading: true });
    
    try {
      const task = await tasksService.update(id, updates);
      dispatch({ type: 'UPDATE_TASK', task });
      return task;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to update task' });
      throw error;
    }
  }, [isAuthenticated]);

  // Delete task
  const deleteTask = useCallback(async (id: string) => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', loading: true });
    
    try {
      await tasksService.delete(id);
      dispatch({ type: 'DELETE_TASK', taskId: id });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to delete task' });
      throw error;
    }
  }, [isAuthenticated]);

  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  // Load tasks on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadTasks();
    } else {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [isAuthenticated, user, loadTasks]);

  // Set up real-time subscription
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleTaskChanges = (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      switch (eventType) {
        case 'INSERT':
          if (newRecord.user_id === user.id) {
            dispatch({ type: 'ADD_TASK', task: newRecord });
          }
          break;
        case 'UPDATE':
          if (newRecord.user_id === user.id) {
            dispatch({ type: 'UPDATE_TASK', task: newRecord });
          }
          break;
        case 'DELETE':
          if (oldRecord.user_id === user.id) {
            dispatch({ type: 'DELETE_TASK', taskId: oldRecord.id });
          }
          break;
      }
    };

    let subscription: any;
    
    const setupSubscription = async () => {
      try {
        subscription = await subscriptions.subscribeToTasks(handleTaskChanges);
      } catch (error) {
        console.error('Failed to set up tasks subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscriptions.unsubscribe('tasks_subscription');
      }
    };
  }, [isAuthenticated, user]);

  const contextValue: TasksContextType = {
    state,
    actions: {
      loadTasks,
      createTask,
      updateTask,
      deleteTask,
      refreshTasks,
      clearError
    }
  };

  return (
    <TasksContext.Provider value={contextValue}>
      {children}
    </TasksContext.Provider>
  );
};

// Hook to use Tasks Context
export const useTasks = (): TasksContextType => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

// Selector hooks for optimized access
export const useTasksState = () => {
  const { state } = useTasks();
  return state;
};

export const useTasksActions = () => {
  const { actions } = useTasks();
  return actions;
};

export const useTaskById = (taskId: string) => {
  const { state } = useTasks();
  return React.useMemo(() => 
    state.tasks.find(t => t.id === taskId), 
    [state.tasks, taskId]
  );
};

export const useTasksByStatus = (status: TaskStatus) => {
  const { state } = useTasks();
  return React.useMemo(() => 
    state.tasks.filter(t => t.status === status), 
    [state.tasks, status]
  );
};

export const useTasksByProject = (projectId: string) => {
  const { state } = useTasks();
  return React.useMemo(() => 
    state.tasks.filter(t => t.project_id === projectId), 
    [state.tasks, projectId]
  );
};

export const useTasksWithDependencies = () => {
  const { state } = useTasks();
  return React.useMemo(() => 
    state.tasks.filter(t => t.dependencies && t.dependencies.length > 0), 
    [state.tasks]
  );
};