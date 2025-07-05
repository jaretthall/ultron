import React, { useState } from 'react';
import { Project, Task, ProjectContext, ProjectStatus, TaskStatus } from '../../../types';
import { useAppState } from '../../contexts/AppStateContext';
import NewTaskModal from '../tasks/NewTaskModal';
import NewProjectModal from '../projects/NewProjectModal';
import OverallProgressIndicator from './OverallProgressIndicator';
import CriticalAlertsPanel from './CriticalAlertsPanel';
import DailyPlanDisplay from './DailyPlanDisplay';
import HealthScoreWidget from './HealthScoreWidget';
import EnhancedHomeStats from './EnhancedHomeStats';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = () => {
  const { state, addTask, addProject } = useAppState();
  const {
    projects,
    tasks,
    // userPreferences,
    // isAuthenticated,
    // allProjects,
    // user
  } = state;

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Handlers for adding tasks and projects
  const handleAddTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await addTask(task);
      console.log('✅ Task added successfully');
    } catch (error) {
      console.error('❌ Failed to add task:', error);
    }
  };

  const handleAddProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await addProject(project);
      console.log('✅ Project added successfully');
    } catch (error) {
      console.error('❌ Failed to add project:', error);
    }
  };

  const recentProjects = projects.filter((p: Project) => p.context === ProjectContext.BUSINESS).slice(0, 3);
  // const urgentTasks = tasks.filter((t: Task) => t.priority === TaskPriority.HIGH && t.status === TaskStatus.TODO).slice(0, 5);

  const activeProjects = projects.filter((project: Project) => project.status === ProjectStatus.ACTIVE);

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Command Center</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Task</span>
            </button>
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Top Row - Progress Overview */}
        <div className="mb-6">
          <OverallProgressIndicator projects={projects} tasks={tasks} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* Left Column - Daily Plan (Takes 2 columns on lg+ screens) */}
          <div className="lg:col-span-2">
            <DailyPlanDisplay tasks={tasks} projects={projects} />
          </div>
          
          {/* Right Column - Critical Alerts */}
          <div className="lg:col-span-1">
            <CriticalAlertsPanel projects={projects} tasks={tasks} />
          </div>
        </div>

        {/* Secondary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
          <HealthScoreWidget projects={projects} tasks={tasks} />
          
          {/* Legacy Quick Stats for comparison */}
          <div className="bg-slate-800 rounded-lg p-4 lg:p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Active Projects</span>
                <span className="text-xl font-bold text-sky-400">{activeProjects.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Tasks</span>
                <span className="text-xl font-bold text-green-400">{tasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pending Tasks</span>
                <span className="text-xl font-bold text-yellow-400">{tasks.filter(t => t.status === TaskStatus.TODO).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">In Progress</span>
                <span className="text-xl font-bold text-blue-400">{tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}</span>
              </div>
            </div>
            
            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-700">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Recent Business Projects</h3>
                <div className="space-y-2">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="text-slate-400 text-sm truncate">
                      • {project.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Stats Section */}
        <EnhancedHomeStats projects={projects} tasks={tasks} />
      </div>
      
      {/* Modals */}
      {isTaskModalOpen && (
        <NewTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onAddTask={handleAddTask}
          projects={projects}
        />
      )}
      
      {isProjectModalOpen && (
        <NewProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onAddProject={handleAddProject}
        />
      )}
    </div>
  );
};

export default HomePage; 