
import React, { useState, useEffect, useCallback } from 'react';
import { WorkspaceSnapshot, TaskStatus, TaskPriority, ProjectStatus } from '../../types';
import { generateWorkspaceSnapshot } from '../../services/exportService';
import { AnalyticsService, AnalyticsData } from '../../services/analyticsService';
import StatCard from './StatCard';
import LoadingSpinner from './LoadingSpinner';
import { useAppState } from '../contexts/AppStateContext';

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

interface DashboardProps {
  navigateTo?: (page: 'Home' | 'Projects' | 'Tasks' | 'Calendar' | 'Documents' | 'Settings') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ navigateTo }) => {
  const { state } = useAppState();
  const { projects, tasks, userPreferences } = state;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exportedData, setExportedData] = useState<WorkspaceSnapshot | null>(null);

  // Stats
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [highPriorityTasksCount, setHighPriorityTasksCount] = useState(0);

  useEffect(() => {
    setActiveProjectsCount(projects.filter(p => p.status === ProjectStatus.ACTIVE).length);
    setTotalTasksCount(tasks.length);
    setPendingTasksCount(tasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS).length);
    setHighPriorityTasksCount(tasks.filter(t => t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT).length);
  }, [projects, tasks]);

  const handleExportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setExportedData(null);
    try {
      const snapshot = await generateWorkspaceSnapshot(projects, tasks, userPreferences);
      setExportedData(snapshot);
      downloadJson(snapshot, 'nexus_workspace_snapshot.json');
    } catch (err) {
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during export.');
    } finally {
      setIsLoading(false);
    }
  }, [projects, tasks, userPreferences]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-sky-400">Nexus Dashboard</h1>
        <p className="text-slate-400 mt-1">Workspace Overview & AI-Powered Insights Export</p>
      </header>

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
          title="Urgent/High Priority Tasks" 
          value={highPriorityTasksCount} 
          icon={<HighPriorityIcon />} 
          color="text-red-400"
          onClick={navigateTo ? () => navigateTo('Tasks') : undefined}
        />
      </section>

      {/* Export Section */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-sky-300 mb-4">Comprehensive Data Export</h2>
        <p className="text-slate-300 mb-6">
          Generate a complete snapshot of your workspace, including projects, tasks, analytics,
          and AI-generated strategic insights. This JSON file can be used for external analysis, backup, or with other AI tools.
        </p>
        <button
          onClick={handleExportData}
          disabled={isLoading || projects.length === 0} // Disable if no projects to export
          className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-800 disabled:text-sky-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-sky-500/50 transition-all duration-300 flex items-center justify-center w-full md:w-auto"
          aria-label="Export workspace data"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="h-5 w-5 mr-2" />
              Generating Snapshot...
            </>
          ) : (
             <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export Workspace Data
            </>
          )}
        </button>
        {error && <p className="text-red-400 mt-4 text-sm" role="alert">Error: {error}</p>}
        {exportedData && !isLoading && !error && (
          <p className="text-emerald-400 mt-4 text-sm" role="status">
            Workspace snapshot successfully generated and download initiated! (nexus_workspace_snapshot.json)
          </p>
        )}
         {(projects.length === 0 && !isLoading) && (
           <p className="text-yellow-400 mt-4 text-sm">No projects or tasks to export. Add some data first.</p>
         )}
      </section>
    </div>
  );
};

export default Dashboard;
