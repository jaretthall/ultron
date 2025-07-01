import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, Task, UserPreferences, ProjectStatus, TaskStatus, TaskPriority, WorkspaceSnapshot } from '../../types';
import { generateWorkspaceSnapshot } from '../../services/exportService';
import { AnalyticsService, AnalyticsData } from '../../services/analyticsService';
import { APP_VERSION, APP_NAME } from '../../constants';
import StatCard from '../StatCard'; 
import LoadingSpinner from '../LoadingSpinner'; 
import NewTaskModal from '../tasks/NewTaskModal'; 
import NewProjectModal from '../projects/NewProjectModal';

// Icons for StatCards
const ProjectIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
  </svg>
);
const TaskIcon: React.FC = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const PendingTaskIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const HighPriorityIcon: React.FC = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);
const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

// New analytics icons
const TrendingUpIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);

const ChartBarIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

interface HomePageProps {
  projects: Project[];
  tasks: Task[];
  userPreferences: UserPreferences; 
  onAddTask: (task: Task) => void;
  allProjects: Project[]; 
  onAddProject: (project: Project) => void;
  navigateTo?: (page: 'Home' | 'Projects' | 'Tasks' | 'Calendar' | 'Documents' | 'Settings') => void;
}

// Helper to download JSON
const downloadJson = (data: object, filename: string): void => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const HomePage: React.FC<HomePageProps> = ({ projects, tasks, userPreferences, onAddTask, allProjects, onAddProject, navigateTo }) => {
  const navigate = useNavigate();
  const [dailyPlan, setDailyPlan] = useState('');
  const [hasActivePlan, setHasActivePlan] = useState(false); 
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  
  // Export functionality
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const activeProjectsCount = projects.filter(p => p.status === ProjectStatus.ACTIVE).length;
  const totalTasksCount = tasks.length;
  const pendingTasksCount = tasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS).length;
  const highPriorityTasksCount = tasks.filter(t => t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT).length;

  // Calculate analytics data when projects or tasks change
  useEffect(() => {
    const calculateAnalytics = async () => {
      if (projects.length === 0 && tasks.length === 0) {
        setIsLoadingAnalytics(false);
        return;
      }
      
      try {
        setIsLoadingAnalytics(true);
        const metrics = AnalyticsService.calculateAnalytics(projects, tasks);
        setAnalyticsData(metrics);
      } catch (error) {
        console.error('Failed to calculate analytics:', error);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    calculateAnalytics();
  }, [projects, tasks]);

  const handleSavePlan = () => {
    setIsLoadingPlan(true);
    setTimeout(() => {
      console.log('Daily plan saved:', dailyPlan);
      setHasActivePlan(dailyPlan.trim().length > 0);
      setIsLoadingPlan(false);
    }, 1000);
  };
  
  const handleCreatePlan = () => {
    setHasActivePlan(true); 
  };

  const handleProjectAddedAndNavigate = (newProject: Project) => {
    onAddProject(newProject); // This will call the onAddProject from App.tsx which handles navigation
    setIsNewProjectModalOpen(false);
    // Navigation is now handled by onAddProject in App.tsx
  };

  // Export functionality
  const handleExportData = async () => {
    if (!userPreferences) {
      setExportError('User preferences not loaded');
      return;
    }
    
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    
    try {
      const snapshot = await generateWorkspaceSnapshot(projects, tasks, userPreferences);
      downloadJson(snapshot, `ultron_workspace_${new Date().toISOString().split('T')[0]}.json`);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back! Here's an overview of your projects and tasks.</p>
          <p className="text-xs text-slate-500 mt-1">{APP_NAME} v{APP_VERSION}</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportData}
            disabled={isExporting || projects.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:text-emerald-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
          >
            {isExporting ? (
              <LoadingSpinner size="h-4 w-4" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            <span className="ml-2">{isExporting ? 'Exporting...' : 'Export JSON'}</span>
          </button>
          <button 
            onClick={() => setIsNewTaskModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
          >
            <PlusIcon /> <span className="ml-2">New Task</span>
          </button>
          <button 
            onClick={() => setIsNewProjectModalOpen(true)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium py-2 px-4 rounded-lg flex items-center text-sm"
          >
            <PlusIcon /> <span className="ml-2">New Project</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Active Projects" 
          value={activeProjectsCount} 
          icon={<ProjectIcon />} 
          color="text-emerald-400"
          onClick={navigateTo ? () => navigateTo('Projects') : undefined}
        />
        <StatCard 
          title="Total Tasks" 
          value={totalTasksCount} 
          icon={<TaskIcon />} 
          color="text-blue-400"
          onClick={navigateTo ? () => navigateTo('Tasks') : undefined}
        />
        <StatCard 
          title="Pending Tasks" 
          value={pendingTasksCount} 
          icon={<PendingTaskIcon />} 
          color="text-yellow-400"
          onClick={navigateTo ? () => navigateTo('Tasks') : undefined}
        />
        <StatCard 
          title="High Priority" 
          value={highPriorityTasksCount} 
          icon={<HighPriorityIcon />} 
          color="text-red-400"
          onClick={navigateTo ? () => navigateTo('Tasks') : undefined}
        />
      </section>

      {/* Analytics Preview Section */}
      {!isLoadingAnalytics && analyticsData && (
        <section className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-100">Productivity Insights</h2>
            <button 
              onClick={() => navigate('/analytics')}
              className="text-sky-400 hover:text-sky-300 text-sm font-medium flex items-center"
            >
              View Full Analytics
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completion Rate */}
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Task Completion Rate</h3>
                <TrendingUpIcon />
              </div>
              <div className="text-2xl font-bold text-slate-100">
                {analyticsData.productivity.taskCompletionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {tasks.filter(t => t.status === TaskStatus.COMPLETED).length} of {tasks.length} tasks completed
              </p>
            </div>

            {/* Average Tasks per Project */}
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Avg Tasks/Project</h3>
                <ChartBarIcon />
              </div>
              <div className="text-2xl font-bold text-slate-100">
                {analyticsData.workloadInsights.averageTasksPerProject.toFixed(1)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {analyticsData.workloadInsights.totalTasksInProgress} tasks in progress
              </p>
            </div>

            {/* Goal Achievement */}
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Goal Achievement</h3>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12.001 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228a9.106 9.106 0 0 1 2.147-.247c.618 0 1.232.038 1.84.107v1.516l-.593.048a6.364 6.364 0 0 0-1.992.463m2.48-5.228v1.72c2.204.16 4.594.38 6.824.588v-2.307a8.997 8.997 0 0 0-6.824-.001v2.8zM18.272 9.728a6.728 6.728 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-slate-100">
                {analyticsData.goals.goalCompletionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {analyticsData.goals.completedGoals} of {analyticsData.goals.totalGoals} goals achieved
              </p>
            </div>
          </div>

          {/* Quick insights */}
          <div className="mt-6 p-4 bg-slate-700 rounded-lg">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Quick Insights</h4>
            <div className="space-y-2 text-sm text-slate-400">
              {analyticsData.workloadInsights.upcomingDeadlines.length > 0 && (
                <div className="flex items-center text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  {analyticsData.workloadInsights.upcomingDeadlines.length} upcoming deadline{analyticsData.workloadInsights.upcomingDeadlines.length !== 1 ? 's' : ''}
                </div>
              )}
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                Average task completion time: {analyticsData.productivity.averageTaskCompletionTime.toFixed(1)} hours
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Time estimation accuracy: {analyticsData.productivity.timeEstimationAccuracy.toFixed(1)}%
              </div>
              {analyticsData.goals.projectsWithGoals > 0 && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  {analyticsData.goals.projectsWithGoals} project{analyticsData.goals.projectsWithGoals !== 1 ? 's' : ''} with goals
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Export Status Messages */}
      {exportError && (
        <div className="bg-red-900/50 border border-red-500 text-red-100 px-4 py-3 rounded-md mb-6">
          <p className="text-sm">Export Error: {exportError}</p>
        </div>
      )}
      {exportSuccess && (
        <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-md mb-6">
          <p className="text-sm">✅ Workspace exported successfully! Check your downloads folder.</p>
        </div>
      )}

      {/* Daily Plan Section */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Daily Plan</h2>
        {hasActivePlan ? (
          <>
            <textarea
              className="w-full h-32 p-3 bg-slate-700 text-slate-200 rounded-md border border-slate-600 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
              placeholder="Paste your AI-generated daily plan here or write your own..."
              value={dailyPlan}
              onChange={(e) => setDailyPlan(e.target.value)}
            />
            <button
              onClick={handleSavePlan}
              disabled={isLoadingPlan}
              className="mt-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center"
            >
              {isLoadingPlan ? <LoadingSpinner size="h-5 w-5" /> : 'Save Plan'}
            </button>
          </>
        ) : (
          <div className="text-center py-10">
             <svg className="mx-auto h-12 w-12 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-slate-300">No active plan</h3>
            <p className="mt-1 text-sm text-slate-500">Create a plan to organize your day and sync it with Jarvis.</p>
            <div className="mt-6">
              <button
                onClick={handleCreatePlan}
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
              >
                <PlusIcon /> <span className="ml-2">Create Plan</span>
              </button>
            </div>
          </div>
        )}
      </section>
      
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Workspace Activity</h2>
        <p className="text-slate-400 text-center py-8">Recent activity and progress overview will be displayed here.</p>
      </section>

      {isNewTaskModalOpen && (
        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          onAddTask={onAddTask}
          projects={allProjects}
        />
      )}
      {isNewProjectModalOpen && (
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onAddProject={handleProjectAddedAndNavigate} // Use the wrapper
        />
      )}
    </div>
  );
};

export default HomePage;