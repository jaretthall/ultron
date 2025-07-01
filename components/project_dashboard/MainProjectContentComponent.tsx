import React, { useState, useMemo } from 'react';
import { Project, Task, TaskStatus, ProjectStatus } from '../../types';
import TaskItem from '../tasks/TaskItem';
import NewTaskModal from '../tasks/NewTaskModal';
import StatCard from '../StatCard'; 

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
  allProjects: Project[]; 
  onEditTaskRequest: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const MainProjectContentComponent: React.FC<MainProjectContentComponentProps> = ({
  project,
  tasks,
  onAddTask,
  allProjects,
  onEditTaskRequest,
  onDeleteTask
}) => {
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  const projectTaskStats = useMemo(() => {
    if (!project) return { completed: 0, inProgress: 0, pending: 0 };
    return {
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      pending: tasks.filter(t => t.status === TaskStatus.TODO).length,
    };
  }, [project, tasks]);

  if (!project) {
    return (
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
           <svg className="mx-auto h-12 w-12 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12a2.25 2.25 0 01-2.25-2.25V3M3.75 21v-6.75A2.25 2.25 0 016 12h12a2.25 2.25 0 012.25 2.25V21M3.75 21H21" />
          </svg>
          <h2 className="mt-2 text-xl font-medium text-slate-300">No Project Selected</h2>
          <p className="mt-1 text-sm text-slate-500">Please select a project from the sidebar to view its details.</p>
        </div>
      </main>
    );
  }

  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== ProjectStatus.COMPLETED;

  const handleAddNewTask = (newTaskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
     onAddTask({ ...newTaskData, project_id: project.id }); // Ensure project_id is set
  };


  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-900">
      {/* Project Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-3xl font-bold text-slate-100">{project.title}</h1>
          <div className="flex space-x-2 mt-3 sm:mt-0">
            <ActionButton onClick={() => setIsNewTaskModalOpen(true)} icon={<PlusIcon />}>
              New Task for {project.title.length > 15 ? project.title.substring(0,12) + "..." : project.title}
            </ActionButton>
          </div>
        </div>
        <p className="text-slate-400 mt-2 text-sm">{project.description}</p>
        {project.deadline && (
          <p className={`text-xs mt-1 ${isOverdue ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
            Deadline: {new Date(project.deadline).toLocaleDateString()} {isOverdue && '(Overdue)'}
          </p>
        )}
      </div>

      {/* Project Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Completed Tasks" value={projectTaskStats.completed} icon={<CompletedIcon />} color="text-green-400" />
        <StatCard title="In Progress" value={projectTaskStats.inProgress} icon={<InProgressIcon />} color="text-blue-400" />
        <StatCard title="Pending Tasks" value={projectTaskStats.pending} icon={<PendingIcon />} color="text-yellow-400" />
      </div>

      {/* Project Goals */}
      {project.goals && project.goals.length > 0 && (
        <div className="mb-8 p-4 bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Project Goals</h3>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
            {project.goals.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Tasks List */}
      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Tasks ({tasks.length})</h3>
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                projectTitle={project.title}
                onEditTaskRequest={onEditTaskRequest}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-800 rounded-lg">
            <svg className="mx-auto h-10 w-10 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3M12 17.25v-6.75" />
            </svg>
            <p className="mt-2 text-sm text-slate-400">No tasks in this project yet.</p>
            <button 
              onClick={() => setIsNewTaskModalOpen(true)}
              className="mt-4 text-sm bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Add New Task
            </button>
          </div>
        )}
      </div>

      {isNewTaskModalOpen && (
        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          onAddTask={handleAddNewTask}
          projects={allProjects} 
          defaultProjectId={project.id} 
        />
      )}
    </main>
  );
};

export default MainProjectContentComponent;
