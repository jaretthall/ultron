import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus } from '../../../types';
import { useScreenSize } from '../ResponsiveLayout';
import NewProjectModal from '../projects/NewProjectModal';

interface LeftSidebarComponentProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onAddProject?: (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
}

const LeftSidebarComponent: React.FC<LeftSidebarComponentProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const { isMobile, isTablet } = useScreenSize();
  
  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') return projects;
    return projects.filter(project => project.status === statusFilter);
  }, [projects, statusFilter]);

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (onAddProject) {
      await onAddProject(projectData);
      setIsNewProjectModalOpen(false);
    }
  };
  
  return (
    <aside className={`${isMobile ? 'w-full' : isTablet ? 'w-full' : 'w-80'} bg-slate-800 ${isMobile ? '' : 'border-r border-slate-700'} overflow-y-auto h-full`}>
      <div className={`${isMobile ? 'p-3' : isTablet ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${isMobile ? 'text-lg' : isTablet ? 'text-lg' : 'text-xl'} font-semibold text-slate-200`}>
            Projects
          </h2>
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white p-2 rounded-lg transition-colors"
            title="Add New Project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Status Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ProjectStatus)}
            className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500"
            title="Filter projects by status"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>

        {/* Projects List */}
        <div className="space-y-2">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-8 w-8 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12a2.25 2.25 0 01-2.25-2.25V3M3.75 21v-6.75A2.25 2.25 0 016 12h12a2.25 2.25 0 012.25 2.25V21M3.75 21H21" />
              </svg>
              <p className="mt-2 text-sm text-slate-400">No projects found</p>
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="mt-3 text-sm bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Create Project
              </button>
            </div>
          ) : (
            filteredProjects.map(project => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedProjectId === project.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-medium truncate ${isTablet ? 'text-sm' : 'text-base'}`}>
                    {project.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'completed' ? 'bg-green-900 text-green-300' :
                    project.status === 'active' ? 'bg-blue-900 text-blue-300' :
                    'bg-yellow-900 text-yellow-300'
                  }`}>
                    {project.status}
                  </span>
                </div>
                {project.context && (
                  <p className={`text-xs text-slate-400 truncate ${isTablet ? 'line-clamp-2' : ''}`}>
                    {project.context}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.project_context === 'business' ? 'bg-purple-900 text-purple-300' :
                    project.project_context === 'personal' ? 'bg-green-900 text-green-300' :
                    'bg-orange-900 text-orange-300'
                  }`}>
                    {project.project_context}
                  </span>
                  {project.deadline && (
                    <span className="text-xs text-slate-400">
                      Due: {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onAddProject={handleAddProject}
        />
      )}
    </aside>
  );
};

export default LeftSidebarComponent; 