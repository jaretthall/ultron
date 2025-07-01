import React, { useState } from 'react';
import { Project } from '../../types';
import NewProjectModal from '../projects/NewProjectModal'; 

interface ProjectListItemProps {
  project: Project;
  isActive?: boolean;
  onSelect: () => void;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const EditIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const DeleteIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);


const ProjectListItem: React.FC<ProjectListItemProps> = ({ project, isActive, onSelect, onEdit, onDelete }) => (
  <div
    className={`flex items-center w-full rounded-md group
      ${isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
  >
    <button
      onClick={onSelect}
      className={`flex-grow px-3 py-2.5 text-sm font-medium text-left truncate focus:outline-none rounded-l-md
        ${isActive ? '' : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {project.context === 'personal' && (
           <span className={`inline-block mr-2 h-2.5 w-2.5 rounded-full ${isActive ? 'bg-white' : 'bg-sky-500 group-hover:bg-sky-400'}`} aria-hidden="true"></span>
      )}
      {project.title}
    </button>
    <div className="flex-shrink-0 space-x-1 pr-2">
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(project); }} 
        className={`p-1 rounded opacity-60 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-white/50
          ${isActive ? 'text-white hover:bg-sky-500' : 'text-slate-400 hover:bg-slate-600' }`}
        aria-label={`Edit project ${project.title}`}
      >
        <EditIcon />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} 
        className={`p-1 rounded opacity-60 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-white/50
          ${isActive ? 'text-red-300 hover:bg-red-500 hover:text-white' : 'text-slate-400 hover:text-red-500 hover:bg-slate-600' }`}
        aria-label={`Delete project ${project.title}`}
      >
        <DeleteIcon />
      </button>
    </div>
  </div>
);

interface LeftSidebarComponentProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onAddProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
  onEditProjectRequest: (project: Project) => void; // Renamed for clarity
  onDeleteProject: (projectId: string) => void;
}

const LeftSidebarComponent: React.FC<LeftSidebarComponentProps> = ({ 
  projects, 
  selectedProjectId, 
  onSelectProject,
  onAddProject,
  onEditProjectRequest,
  onDeleteProject
}) => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const handleProjectAdded = (newProject: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    onAddProject(newProject);
    setIsNewProjectModalOpen(false);
  };

  return (
    <aside className="w-64 bg-slate-800 p-4 flex flex-col border-r border-slate-700 shrink-0 self-stretch">
      <div className="flex items-center justify-between mb-3 px-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</h2>
        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-700 rounded transition-colors"
          title="New Project"
        >
          <PlusIcon />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectListItem 
              key={project.id} 
              project={project} 
              isActive={project.id === selectedProjectId}
              onSelect={() => onSelectProject(project.id)}
              onEdit={onEditProjectRequest}
              onDelete={onDeleteProject}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400 mb-4">No projects available.</p>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center mx-auto"
            >
              <PlusIcon />
              <span className="ml-2">Create Project</span>
            </button>
          </div>
        )}
      </nav>

      {isNewProjectModalOpen && (
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onAddProject={handleProjectAdded}
        />
      )}
    </aside>
  );
};

export default LeftSidebarComponent;
