import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HeaderComponent from './src/components/project_dashboard/HeaderComponent';
import ProjectDashboardPage from './src/components/project_dashboard/ProjectDashboardPage';
import HomePage from './src/components/home/HomePage';
import TaskManagementPage from './src/components/tasks/TaskManagementPage';
import CalendarPage from './src/components/calendar/CalendarPage';
import DocumentsPage from './src/components/documents/DocumentsPage';
import SettingsPage from './src/components/settings/SettingsPage';
import AIDashboard from './src/components/ai/AIDashboard';
import AnalyticsDashboard from './src/components/analytics/AnalyticsDashboard';
import GlobalSearch from './src/components/GlobalSearch';
import { Project, Task } from './types';
import LoadingSpinner from './src/components/LoadingSpinner';
import EditProjectModal from './src/components/projects/EditProjectModal';
import EditTaskModal from './src/components/tasks/EditTaskModal';
import FeedbackToast from './src/components/FeedbackToast';
import { AppStateProvider, useAppState } from './src/contexts/AppStateContext';
// Phase 6: Production Readiness - Security & Monitoring
import { 
  captureException, 
  trackUserInteraction, 
  ErrorCategory, 
  ErrorSeverity
} from './src/services/monitoringService';
import { initializeSecurity } from './src/utils/securityUtils';

interface SearchResult {
  type: 'project' | 'task' | 'tag';
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
  priority?: string;
  status?: string;
  context?: string;
  tags?: string[];
  relevanceScore: number;
}

// AppWithAuth Content Component (uses AppStateContext)
const AppWithAuthContent: React.FC = () => {
  const {
    state,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    clearError
  } = useAppState();
  const navigate = useNavigate();

  // Local UI state for modals
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Global Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Project context filter state
  const [projectContextFilter, setProjectContextFilter] = useState<'all' | 'business' | 'personal'>('all');

  // Phase 6: Initialize security and monitoring
  useEffect(() => {
    // Initialize security services
    initializeSecurity();
    
    // Track app initialization
    trackUserInteraction('app_initialized', 'main_app');
    
    console.log('[Phase 6] Security and monitoring services initialized');
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        trackUserInteraction('keyboard_shortcut', 'global_search', { key: 'cmd+k' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle search result selection
  const handleSearchResult = (result: SearchResult) => {
    switch (result.type) {
      case 'project':
        navigate(`/projects?projectId=${result.id}`);
        break;
      case 'task':
        // Find the task and open its edit modal
        const task = state.tasks.find(t => t.id === result.id);
        if (task) {
          setTaskToEdit(task);
        }
        break;
      case 'tag':
        // Navigate to tasks page with tag filter (we could enhance this later)
        navigate('/tasks');
        showToastMessage(`Showing items tagged with "${result.title}"`, 'info');
        break;
    }
  };

  // Clear feedback automatically
  React.useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Modal handlers
  const handleOpenEditProjectModal = (project: Project) => {
    setProjectToEdit(project);
  };

  const handleOpenEditTaskModal = (task: Task) => {
    setTaskToEdit(task);
  };

  // CRUD operation handlers with feedback
  const handleAddProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const project = await addProject(projectData);
      setFeedback({ type: 'success', message: `Project '${project.title}' created successfully.` });
      trackUserInteraction('create_project', 'project_form', { projectTitle: project.title });
    } catch (error: any) {
      captureException(error, {
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.MEDIUM,
        additionalData: { operation: 'create_project', projectData }
      });
      setFeedback({ type: 'error', message: error.message || 'Failed to create project' });
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      await updateProject(updatedProject.id, updatedProject);
      setFeedback({ type: 'success', message: `Project '${updatedProject.title}' updated successfully.` });
      setProjectToEdit(null);
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || 'Failed to update project' });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = state.projects.find((p: Project) => p.id === projectId);
    const projectName = project?.title || 'Unknown project';
    
    if (!window.confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProject(projectId);
      setFeedback({ type: 'success', message: `Project '${projectName}' deleted successfully.` });
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || 'Failed to delete project' });
    }
  };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const task = await addTask(taskData);
      setFeedback({ type: 'success', message: `Task '${task.title}' created successfully.` });
      trackUserInteraction('create_task', 'task_form', { 
        taskTitle: task.title, 
        priority: task.priority,
        projectId: task.project_id 
      });
    } catch (error: any) {
      captureException(error, {
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.MEDIUM,
        additionalData: { operation: 'create_task', taskData }
      });
      setFeedback({ type: 'error', message: error.message || 'Failed to create task' });
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask.id, updatedTask);
      setFeedback({ type: 'success', message: `Task '${updatedTask.title}' updated successfully.` });
      setTaskToEdit(null);
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || 'Failed to update task' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = state.tasks.find((t: Task) => t.id === taskId);
    const taskName = task?.title || 'Unknown task';
    
    if (!window.confirm(`Are you sure you want to delete "${taskName}"?`)) {
      return;
    }

    try {
      await deleteTask(taskId);
      setFeedback({ type: 'success', message: `Task '${taskName}' deleted successfully.` });
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || 'Failed to delete task' });
    }
  };



     const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
     // Convert 'info' to 'success' for the existing feedback system
     const feedbackType = type === 'info' ? 'success' : type;
     setFeedback({ type: feedbackType, message: message });
   };

  // Error display
  const renderErrorDisplay = () => {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center">
        <div className="max-w-md mx-auto bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-red-300">Application Error</h1>
              <p className="text-sm text-slate-300 mt-2">{state.error}</p>
            </div>
          </div>
          <div className="mt-6 flex space-x-3">
            <button
              onClick={clearError}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Dismiss Error
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show error if exists
  if (state.error) {
    return renderErrorDisplay();
  }

  // Show loading if loading
  if (state.loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-slate-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <HeaderComponent 
        projectContextFilter={projectContextFilter}
        onProjectContextFilterChange={setProjectContextFilter}
      />
      
      {/* Sync Status Indicator */}
      {state.syncStatus === 'syncing' && (
        <div className="bg-slate-800 border-l-4 border-blue-400 p-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <LoadingSpinner />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-300">Syncing your data...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Offline Indicator */}
      {!state.isOnline && (
        <div className="bg-slate-800 border-l-4 border-yellow-400 p-2">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-300">
                You're offline. Changes will be synced when you reconnect.
                {state.pendingOperations.length > 0 && ` (${state.pendingOperations.length} pending)`}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={
            state.userPreferences ? (
              <HomePage 
                onNavigate={() => {}}
              />
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <LoadingSpinner />
                  <p className="mt-4 text-slate-400">Loading user preferences...</p>
                </div>
              </div>
            )
          } />
          <Route path="/projects" element={
            <ProjectDashboardPage 
              projects={state.projects}
              tasks={state.tasks}
              onAddTask={handleAddTask}
              onAddProject={handleAddProject}
              onEditProjectRequest={handleOpenEditProjectModal}
              onDeleteProject={handleDeleteProject}
              onEditTaskRequest={handleOpenEditTaskModal}
              onDeleteTask={handleDeleteTask}
              projectContextFilter={projectContextFilter}
            />
          } />
          <Route path="/tasks" element={
            <TaskManagementPage 
              initialTasks={state.tasks}
              projects={state.projects}
              onAddTask={handleAddTask}
              onEditTaskRequest={handleOpenEditTaskModal}
              onDeleteTask={handleDeleteTask}
            />
          } />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/documents" element={<DocumentsPage onNavigate={() => {}} />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/ai" element={
            <AIDashboard />
          } />
          <Route path="/analytics" element={
            <AnalyticsDashboard onNavigate={() => {}} />
          } />
        </Routes>
      </main>

      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSearchResult}
      />

             {/* Edit Project Modal */}
       {projectToEdit && (
         <EditProjectModal
           project={projectToEdit}
           isOpen={!!projectToEdit}
           onClose={() => setProjectToEdit(null)}
           onUpdateProject={handleUpdateProject}
         />
       )}

       {/* Edit Task Modal */}
       {taskToEdit && (
         <EditTaskModal
           task={taskToEdit}
           isOpen={!!taskToEdit}
           onClose={() => setTaskToEdit(null)}
           onUpdateTask={handleUpdateTask}
           projects={state.projects}
         />
       )}

             {/* Feedback Toast */}
       {feedback && (
         <FeedbackToast
           message={feedback.message}
           type={feedback.type}
           onDismiss={() => setFeedback(null)}
         />
       )}
    </div>
  );
};

// Main AppWithAuth Component (provides AppStateContext)
const AppWithAuth: React.FC = () => {
  return (
    <AppStateProvider>
      <AppWithAuthContent />
    </AppStateProvider>
  );
};

export default AppWithAuth; 