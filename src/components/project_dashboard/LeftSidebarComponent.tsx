import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus } from '../../../types';
import { calculateUrgencyScore } from '../../utils/projectUtils';
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

  const { isMobile } = useScreenSize();
  
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
    <aside className={`${isMobile ? 'w-full' : 'w-80'} bg-slate-800 ${isMobile ? '' : 'border-r border-slate-700'} overflow-y-auto`}>
      <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-slate-200`}>Projects</h2>
          {onAddProject && (
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className={`bg-sky-600 hover:bg-sky-700 text-white ${isMobile ? 'p-1.5' : 'p-2'} rounded-lg transition-colors flex items-center space-x-1`}
              title="Add new project"
            >
              <svg className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {!isMobile && <span className="text-xs">New</span>}
            </button>
          )}
        </div>
        
        {/* Status Filter */}
        <div className="mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ProjectStatus)}
            className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500"
            title="Filter projects by status"
          >
            <option value="all">All Projects</option>
            <option value={ProjectStatus.ACTIVE}>Active</option>
            <option value={ProjectStatus.COMPLETED}>Completed</option>
            <option value={ProjectStatus.ON_HOLD}>On Hold</option>
          </select>
        </div>
        
        <div className="space-y-2" data-testid="project-list">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-8 w-8 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12a2.25 2.25 0 01-2.25-2.25V3M3.75 21v-6.75A2.25 2.25 0 016 12h12a2.25 2.25 0 012.25 2.25V21M3.75 21H21" />
              </svg>
              <p className="mt-2 text-sm text-slate-400">
                {statusFilter === 'all' ? 'No projects yet' : `No ${statusFilter} projects`}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isSelected = project.id === selectedProjectId;
              const urgencyScore = calculateUrgencyScore(project.deadline);
              const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed';
              
              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full text-left ${isMobile ? 'p-2' : 'p-3'} rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {project.title}
                      </h3>
                      <p className={`text-xs mt-1 truncate ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                        {project.description || 'No description'}
                      </p>
                      
                      {/* Project Status and Context */}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          project.status === 'completed' ? 'bg-green-900 text-green-300' :
                          project.status === 'active' ? 'bg-blue-900 text-blue-300' :
                          'bg-yellow-900 text-yellow-300'
                        }`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          project.project_context === 'business' ? 'bg-purple-900 text-purple-300' :
                          project.project_context === 'personal' ? 'bg-green-900 text-green-300' :
                          'bg-orange-900 text-orange-300'
                        }`}>
                          {project.project_context.charAt(0).toUpperCase() + project.project_context.slice(1)}
                        </span>
                      </div>
                      
                      {/* Deadline and Urgency */}
                      {project.deadline && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${isOverdue ? 'text-red-400 font-medium' : isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                              {new Date(project.deadline).toLocaleDateString()}
                              {isOverdue && ' (Overdue)'}
                            </span>
                            {urgencyScore > 0 && (
                              <span className={`text-xs font-medium ${
                                urgencyScore >= 80 ? 'text-red-400' :
                                urgencyScore >= 60 ? 'text-orange-400' :
                                urgencyScore >= 40 ? 'text-yellow-400' :
                                'text-green-400'
                              }`}>
                                {urgencyScore}/100
                              </span>
                            )}
                          </div>
                          {urgencyScore > 0 && (
                            <div className="w-full bg-slate-600 rounded-full h-1 mt-1">
                              <div 
                                className={`h-1 rounded-full transition-all duration-300 ${
                                  urgencyScore >= 80 ? 'bg-red-500' :
                                  urgencyScore >= 60 ? 'bg-orange-500' :
                                  urgencyScore >= 40 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${urgencyScore}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Business Relevance */}
                      {project.business_relevance && (
                        <div className="mt-2">
                          <span className={`text-xs ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                            Priority: {project.business_relevance}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
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