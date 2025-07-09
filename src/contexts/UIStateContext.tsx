/**
 * UI State Context - Focused context for UI state management
 * Part of Phase 3 performance optimization to reduce unnecessary re-renders
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Action Types
type UIAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_SIDEBAR_OPEN'; isOpen: boolean }
  | { type: 'SET_MODAL_OPEN'; modalId: string; isOpen: boolean }
  | { type: 'SET_ACTIVE_VIEW'; view: string }
  | { type: 'SET_SEARCH_OPEN'; isOpen: boolean }
  | { type: 'SET_NOTIFICATIONS'; notifications: Notification[] }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'REMOVE_NOTIFICATION'; id: string }
  | { type: 'SET_THEME'; theme: 'light' | 'dark' }
  | { type: 'SET_FILTER'; filterId: string; filter: any }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'RESET_STATE' };

// Notification interface
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

// State Interface
interface UIState {
  loading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  openModals: Set<string>;
  activeView: string;
  searchOpen: boolean;
  notifications: Notification[];
  theme: 'light' | 'dark';
  filters: Record<string, any>;
}

// Context Interface
interface UIStateContextType {
  state: UIState;
  actions: {
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
    openModal: (modalId: string) => void;
    closeModal: (modalId: string) => void;
    isModalOpen: (modalId: string) => boolean;
    setActiveView: (view: string) => void;
    toggleSearch: () => void;
    setSearchOpen: (isOpen: boolean) => void;
    showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
    setFilter: (filterId: string, filter: any) => void;
    getFilter: (filterId: string) => any;
    clearFilters: () => void;
  };
}

// Initial State
const initialState: UIState = {
  loading: false,
  error: null,
  sidebarOpen: false,
  openModals: new Set(),
  activeView: 'home',
  searchOpen: false,
  notifications: [],
  theme: 'dark',
  filters: {}
};

// Reducer
function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    
    case 'SET_ERROR':
      return { ...state, error: action.error };
    
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.isOpen };
    
    case 'SET_MODAL_OPEN':
      const newModals = new Set(state.openModals);
      if (action.isOpen) {
        newModals.add(action.modalId);
      } else {
        newModals.delete(action.modalId);
      }
      return { ...state, openModals: newModals };
    
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.view };
    
    case 'SET_SEARCH_OPEN':
      return { ...state, searchOpen: action.isOpen };
    
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.notifications };
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.notification, ...state.notifications] 
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id)
      };
    
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.filterId]: action.filter }
      };
    
    case 'CLEAR_FILTERS':
      return { ...state, filters: {} };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Create Context
const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

// Provider Component
export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Basic actions
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  // Sidebar actions
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', isOpen: !state.sidebarOpen });
  }, [state.sidebarOpen]);

  const setSidebarOpen = useCallback((isOpen: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', isOpen });
  }, []);

  // Modal actions
  const openModal = useCallback((modalId: string) => {
    dispatch({ type: 'SET_MODAL_OPEN', modalId, isOpen: true });
  }, []);

  const closeModal = useCallback((modalId: string) => {
    dispatch({ type: 'SET_MODAL_OPEN', modalId, isOpen: false });
  }, []);

  const isModalOpen = useCallback((modalId: string) => {
    return state.openModals.has(modalId);
  }, [state.openModals]);

  // View actions
  const setActiveView = useCallback((view: string) => {
    dispatch({ type: 'SET_ACTIVE_VIEW', view });
  }, []);

  // Search actions
  const toggleSearch = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_OPEN', isOpen: !state.searchOpen });
  }, [state.searchOpen]);

  const setSearchOpen = useCallback((isOpen: boolean) => {
    dispatch({ type: 'SET_SEARCH_OPEN', isOpen });
  }, []);

  // Notification actions
  const showNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(2);
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now()
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', notification: fullNotification });

    // Auto-remove notification after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', id });
    }, duration);
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', id });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'SET_NOTIFICATIONS', notifications: [] });
  }, []);

  // Theme actions
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', theme });
    // Persist theme preference
    localStorage.setItem('ultron-theme', theme);
  }, []);

  // Filter actions
  const setFilter = useCallback((filterId: string, filter: any) => {
    dispatch({ type: 'SET_FILTER', filterId, filter });
  }, []);

  const getFilter = useCallback((filterId: string) => {
    return state.filters[filterId];
  }, [state.filters]);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  // Initialize theme from localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('ultron-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      dispatch({ type: 'SET_THEME', theme: savedTheme });
    }
  }, []);

  const contextValue: UIStateContextType = {
    state,
    actions: {
      setLoading,
      setError,
      clearError,
      toggleSidebar,
      setSidebarOpen,
      openModal,
      closeModal,
      isModalOpen,
      setActiveView,
      toggleSearch,
      setSearchOpen,
      showNotification,
      removeNotification,
      clearNotifications,
      setTheme,
      setFilter,
      getFilter,
      clearFilters
    }
  };

  return (
    <UIStateContext.Provider value={contextValue}>
      {children}
    </UIStateContext.Provider>
  );
};

// Hook to use UI State Context
export const useUIState = (): UIStateContextType => {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};

// Selector hooks for optimized access
export const useUILoading = () => {
  const { state } = useUIState();
  return state.loading;
};

export const useUIError = () => {
  const { state } = useUIState();
  return state.error;
};

export const useSidebar = () => {
  const { state, actions } = useUIState();
  return {
    isOpen: state.sidebarOpen,
    toggle: actions.toggleSidebar,
    setOpen: actions.setSidebarOpen
  };
};

export const useNotifications = () => {
  const { state, actions } = useUIState();
  return {
    notifications: state.notifications,
    show: actions.showNotification,
    remove: actions.removeNotification,
    clear: actions.clearNotifications
  };
};

export const useTheme = () => {
  const { state, actions } = useUIState();
  return {
    theme: state.theme,
    setTheme: actions.setTheme
  };
};

export const useFilters = () => {
  const { actions } = useUIState();
  return {
    setFilter: actions.setFilter,
    getFilter: actions.getFilter,
    clearFilters: actions.clearFilters
  };
};