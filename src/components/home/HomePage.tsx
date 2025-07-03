import React from 'react';
import { Project, Task, ProjectContext, ProjectStatus, TaskStatus, TaskPriority } from '../../../types';
import { useAppState } from '../../contexts/AppStateContext';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = () => {
  const { state } = useAppState();
  const {
    projects,
    tasks,
    // userPreferences,
    // isAuthenticated,
    // allProjects,
    // user
  } = state;

  // Default handlers for adding tasks and projects
  const onAddTask = (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('Add task:', task);
    // Implementation would go here
  };

  const onAddProject = (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('Add project:', project);
    // Implementation would go here
  };

  const recentProjects = projects.filter((p: Project) => p.context === ProjectContext.BUSINESS).slice(0, 3);
  // const urgentTasks = tasks.filter((t: Task) => t.priority === TaskPriority.HIGH && t.status === TaskStatus.TODO).slice(0, 5);

  const activeProjects = projects.filter((project: Project) => project.status === ProjectStatus.ACTIVE);

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Quick Stats */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Stats</h2>
            <div className="space-y-2 text-slate-300">
              <p>Active Projects: {activeProjects.length}</p>
              <p>Total Tasks: {tasks.length}</p>
              <p>Pending Tasks: {tasks.filter(t => t.status === TaskStatus.TODO).length}</p>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Projects</h2>
            <div className="space-y-2">
              {recentProjects.map((project) => (
                <div key={project.id} className="text-slate-300 text-sm">
                  {project.title}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button 
                onClick={() => onAddTask({
                  title: 'New Task',
                  description: '',
                  priority: TaskPriority.MEDIUM,
                  estimated_hours: 1,
                  status: TaskStatus.TODO,
                  dependencies: [],
                  tags: []
                })}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded text-sm"
              >
                Add New Task
              </button>
              <button 
                onClick={() => onAddProject({
                  title: 'New Project',
                  description: '',
                  goals: [],
                  status: ProjectStatus.ACTIVE,
                  context: ProjectContext.BUSINESS,
                  tags: []
                })}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                New Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 