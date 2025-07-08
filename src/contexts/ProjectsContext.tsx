/**
 * Projects Context - Focused context for project management
 * Part of Phase 3 performance optimization to reduce unnecessary re-renders
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Project } from '../../types';
import { useCustomAuth } from './CustomAuthContext';
import { projectsService } from '../../services/databaseService';
import { subscriptions } from '../../services/databaseService';
import { performanceMonitor } from '../utils/performanceMonitoring';

// Action Types
type ProjectAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_PROJECTS'; projects: Project[] }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'DELETE_PROJECT'; projectId: string }
  | { type: 'RESET_STATE' };

// State Interface
interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

// Context Interface
interface ProjectsContextType {
  state: ProjectsState;
  actions: {
    loadProjects: () => Promise<void>;
    createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Project>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
    deleteProject: (id: string) => Promise<void>;
    refreshProjects: () => Promise<void>;
    clearError: () => void;
  };
}

// Initial State
const initialState: ProjectsState = {
  projects: [],
  loading: false,
  error: null
};

// Reducer
function projectsReducer(state: ProjectsState, action: ProjectAction): ProjectsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.projects, loading: false, error: null };
    
    case 'ADD_PROJECT':
      return { 
        ...state, 
        projects: [action.project, ...state.projects],
        loading: false,
        error: null 
      };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.project.id ? action.project : p
        ),
        loading: false,
        error: null
      };
    
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.projectId),
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
const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

// Provider Component
export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectsReducer, initialState);
  const { user, isAuthenticated } = useCustomAuth();

  // Load projects
  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    dispatch({ type: 'SET_LOADING', loading: true });
    
    try {
      performanceMonitor.trackComponentRender('ProjectsProvider.loadProjects', performance.now(), false, false);
      
      const projects = await projectsService.getAll();
      dispatch({ type: 'SET_PROJECTS', projects });
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to load projects' });
    }
  }, [isAuthenticated, user]);

  // Create project
  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', loading: true });
    
    try {
      const project = await projectsService.create(projectData);
      dispatch({ type: 'ADD_PROJECT', project });
      return project;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to create project' });
      throw error;
    }
  }, [isAuthenticated]);

  // Update project
  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', loading: true });
    
    try {
      const project = await projectsService.update(id, updates);
      dispatch({ type: 'UPDATE_PROJECT', project });
      return project;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to update project' });
      throw error;
    }
  }, [isAuthenticated]);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    dispatch({ type: 'SET_LOADING', loading: true });
    
    try {
      await projectsService.delete(id);
      dispatch({ type: 'DELETE_PROJECT', projectId: id });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to delete project' });
      throw error;
    }
  }, [isAuthenticated]);

  // Refresh projects
  const refreshProjects = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  // Load projects on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadProjects();
    } else {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [isAuthenticated, user, loadProjects]);

  // Set up real-time subscription
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleProjectChanges = (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      switch (eventType) {
        case 'INSERT':
          if (newRecord.user_id === user.id) {
            dispatch({ type: 'ADD_PROJECT', project: newRecord });
          }
          break;
        case 'UPDATE':
          if (newRecord.user_id === user.id) {
            dispatch({ type: 'UPDATE_PROJECT', project: newRecord });
          }
          break;
        case 'DELETE':
          if (oldRecord.user_id === user.id) {
            dispatch({ type: 'DELETE_PROJECT', projectId: oldRecord.id });
          }
          break;
      }
    };

    let subscription: any;
    
    const setupSubscription = async () => {
      try {
        subscription = await subscriptions.subscribeToProjects(handleProjectChanges);
      } catch (error) {
        console.error('Failed to set up projects subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscriptions.unsubscribe('projects_subscription');
      }
    };
  }, [isAuthenticated, user]);

  const contextValue: ProjectsContextType = {
    state,
    actions: {
      loadProjects,
      createProject,
      updateProject,
      deleteProject,
      refreshProjects,
      clearError
    }
  };

  return (
    <ProjectsContext.Provider value={contextValue}>
      {children}
    </ProjectsContext.Provider>
  );
};

// Hook to use Projects Context
export const useProjects = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

// Selector hooks for optimized access
export const useProjectsState = () => {
  const { state } = useProjects();
  return state;
};

export const useProjectsActions = () => {
  const { actions } = useProjects();
  return actions;
};

export const useProjectById = (projectId: string) => {
  const { state } = useProjects();
  return React.useMemo(() => 
    state.projects.find(p => p.id === projectId), 
    [state.projects, projectId]
  );
};

export const useProjectsByStatus = (status: string) => {
  const { state } = useProjects();
  return React.useMemo(() => 
    state.projects.filter(p => p.status === status), 
    [state.projects, status]
  );
};