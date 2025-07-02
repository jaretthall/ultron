import React from 'react';
import { Project, Task, UserPreferences } from '../../../types';

interface HomePageProps {
  projects: Project[];
  tasks: Task[];
  userPreferences: UserPreferences;
  onAddTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  allProjects: Project[];
  onAddProject: (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
}

const HomePage: React.FC<HomePageProps> = ({ 
  projects, 
  tasks, 
  userPreferences, 
  onAddTask, 
  allProjects, 
  onAddProject 
}) => {
  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Welcome to Ultron</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Quick Stats */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Stats</h2>
            <div className="space-y-2 text-slate-300">
              <p>Active Projects: {projects.filter(p => p.status === 'active').length}</p>
              <p>Total Tasks: {tasks.length}</p>
              <p>Pending Tasks: {tasks.filter(t => t.status === 'todo').length}</p>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Projects</h2>
            <div className="space-y-2">
              {projects.slice(0, 3).map((project) => (
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
                  priority: 'medium',
                  estimated_hours: 1,
                  status: 'todo',
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
                  status: 'active',
                  context: 'business',
                  tags: []
                })}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm"
              >
                Add New Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 