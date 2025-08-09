import React, { useState, useMemo } from 'react';
import { Project, Task, TaskStatus, ProjectStatus } from '../../../types';
import TaskItem from '../tasks/TaskItem';
import NewTaskModal from '../tasks/NewTaskModal';
import StatCard from '../StatCard';
import EditProjectModal from '../projects/EditProjectModal';
import { calculateProjectCompletion, calculateUrgencyScore } from '../../utils/projectUtils';
import { useScreenSize } from '../ResponsiveLayout';
import { useLabels } from '../../hooks/useLabels';

// Icons
const CompletedIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const InProgressIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const PendingIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);


interface ActionButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ children, icon, fullWidth, className = '', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center px-4 py-2.5 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-sky-500 transition-colors duration-150 ${fullWidth ? 'w-full' : ''} ${className}`}
  >
    {icon && <span className="mr-2">{icon}</span>}
    {children}
  </button>
);

interface MainProjectContentComponentProps {
  project: Project | null;
  tasks: Task[];
  allTasksForProjectContext: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onEditTaskRequest?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => Promise<void>;
  allProjects: Project[];
}

const MainProjectContentComponent: React.FC<MainProjectContentComponentProps> = ({
  project,
  tasks,
  onAddTask,
  onUpdateProject,
  onDeleteProject,
  onEditTaskRequest,
  onDeleteTask,
  allProjects,
}) => {
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const { isMobile, isTablet } = useScreenSize();
  const labels = useLabels();

  const projectTaskStats = useMemo(() => {
    if (!project) return { completed: 0, inProgress: 0, pending: 0 };
    return {
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      pending: tasks.filter(t => t.status === TaskStatus.TODO).length,
    };
  }, [project, tasks]);

  // const enrichedProject = useMemo(() => {
  //   if (!project) return null;
  //   return {
  //     ...project,
  //     // Add enrichment logic here
  //   };
  // }, [project]);

  const urgencyScore = useMemo(() => {
    return project?.deadline ? calculateUrgencyScore(project.deadline) : 0;
  }, [project?.deadline]);

  const completionPercentage = useMemo(() => {
    return project ? calculateProjectCompletion(project, tasks) : 0;
  }, [project, tasks]);

  if (!project) {
    return (
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
           <svg className="mx-auto h-12 w-12 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12a2.25 2.25 0 01-2.25-2.25V3M3.75 21v-6.75A2.25 2.25 0 016 12h12a2.25 2.25 0 012.25 2.25V21M3.75 21H21" />
          </svg>
          <h2 className="mt-2 text-xl font-medium text-slate-300">No {labels.project} Selected</h2>
          <p className="mt-1 text-sm text-slate-500">Please select a project from the sidebar to view its details.</p>
        </div>
      </main>
    );
  }

  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== ProjectStatus.COMPLETED;

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-900">
      <div className="max-w-full">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className={`${isMobile ? 'text-2xl' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-slate-100 truncate`}>
                {project.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  project.status === 'completed' ? 'bg-green-900 text-green-300' :
                  project.status === 'active' ? 'bg-blue-900 text-blue-300' :
                  'bg-yellow-900 text-yellow-300'
                }`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  project.project_context === 'business' ? 'bg-purple-900 text-purple-300' :
                  project.project_context === 'personal' ? 'bg-green-900 text-green-300' :
                  'bg-orange-900 text-orange-300'
                }`}>
                  {project.project_context.charAt(0).toUpperCase() + project.project_context.slice(1)}
                </span>
                {project.business_relevance && (
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    Priority: {project.business_relevance}/10
                  </span>
                )}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {project.tags.slice(0, isMobile ? 2 : isTablet ? 2 : 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded-full">
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > (isMobile ? 2 : isTablet ? 2 : 3) && (
                      <span className="text-xs text-slate-400">
                        +{project.tags.length - (isMobile ? 2 : isTablet ? 2 : 3)} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <ActionButton 
                onClick={() => setIsEditProjectModalOpen(true)}
                fullWidth={isMobile}
                className={isMobile ? 'text-sm' : ''}
              >
{labels.editProject}
              </ActionButton>
              <ActionButton 
                onClick={() => setIsNewTaskModalOpen(true)} 
                icon={<PlusIcon />}
                fullWidth={isMobile}
                className={isMobile ? 'text-sm' : ''}
              >
{labels.newTask}
              </ActionButton>
            </div>
          </div>
          {project.description && (
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">{project.description}</p>
          )}
          
          {/* Project Metrics Bar */}
          <div className="mt-4 p-3 sm:p-4 bg-slate-800 rounded-lg">
            <div className={`grid gap-3 sm:gap-4 ${
              isMobile ? 'grid-cols-1' : 
              isTablet ? 'grid-cols-2' : 
              'grid-cols-1 md:grid-cols-3'
            }`}>
              {/* Completion Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-300">Completion</span>
                  <span className="text-sm font-medium text-slate-200">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Urgency Score */}
              {project.deadline && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300">Urgency</span>
                    <span className={`text-sm font-medium ${
                      urgencyScore >= 80 ? 'text-red-400' :
                      urgencyScore >= 60 ? 'text-orange-400' :
                      urgencyScore >= 40 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {urgencyScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        urgencyScore >= 80 ? 'bg-red-500' :
                        urgencyScore >= 60 ? 'bg-orange-500' :
                        urgencyScore >= 40 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${urgencyScore}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Deadline Info */}
              {project.deadline && (
                <div className={isTablet && project.deadline ? 'col-span-2 md:col-span-1' : ''}>
                  <span className="text-sm text-slate-300">Deadline</span>
                  <p className={`text-sm font-medium mt-1 ${isOverdue ? 'text-red-400' : 'text-slate-200'}`}>
                    {new Date(project.deadline).toLocaleDateString()}
                    {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Details Section */}
        {project.description && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-800 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{labels.project} Details</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{project.description}</p>
          </div>
        )}

        <div className={`grid gap-3 sm:gap-4 mb-6 sm:mb-8 ${
          isMobile ? 'grid-cols-1' : 
          isTablet ? 'grid-cols-2' : 
          'grid-cols-1 md:grid-cols-3'
        }`}>
          <StatCard title={`Completed ${labels.tasks}`} value={projectTaskStats.completed} icon={<CompletedIcon />} color="text-green-400" />
          <StatCard title="In Progress" value={projectTaskStats.inProgress} icon={<InProgressIcon />} color="text-blue-400" />
          <StatCard title={`Pending ${labels.tasks}`} value={projectTaskStats.pending} icon={<PendingIcon />} color="text-yellow-400" />
        </div>

        {project.goals && project.goals.length > 0 && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-slate-800 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{labels.project} Goals</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
              {project.goals.map((goal, index) => (
                <li key={index} className="break-words">{goal}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-xl font-semibold text-slate-100 mb-4">{labels.tasks} ({tasks.length})</h3>
          {tasks.length > 0 ? (
            <div className="space-y-3" data-testid="task-list">
              {tasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  projectTitle={project.title}
                  onEditTaskRequest={onEditTaskRequest || (() => {})}
                  onDeleteTask={onDeleteTask || (() => Promise.resolve())}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-10 bg-slate-800 rounded-lg">
              <svg className="mx-auto h-10 w-10 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3M12 17.25v-6.75" />
              </svg>
              <p className="mt-2 text-sm text-slate-400">No tasks in this project yet.</p>
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="mt-4 text-sm bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
{labels.newTask}
              </button>
            </div>
          )}
        </div>
      </div>

      {isNewTaskModalOpen && (
        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          onAddTask={onAddTask}
          projects={allProjects}
          defaultProjectId={project.id}
        />
      )}

      {isEditProjectModalOpen && onUpdateProject && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          onClose={() => setIsEditProjectModalOpen(false)}
          onUpdateProject={(updatedProject) => {
            onUpdateProject(updatedProject);
            setIsEditProjectModalOpen(false);
          }}
          onDeleteProject={onDeleteProject}
          project={project}
        />
      )}
    </main>
  );
};

export default MainProjectContentComponent;
