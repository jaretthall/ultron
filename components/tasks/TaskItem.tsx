import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types';

interface TaskItemProps {
  task: Task;
  projectTitle: string;
  onEditTaskRequest: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const getPriorityClass = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.URGENT: return 'bg-red-500 text-red-50';
    case TaskPriority.HIGH: return 'bg-orange-500 text-orange-50';
    case TaskPriority.MEDIUM: return 'bg-yellow-500 text-yellow-800';
    case TaskPriority.LOW: return 'bg-sky-500 text-sky-50';
    default: return 'bg-slate-500 text-slate-50';
  }
};

const getStatusClass = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.TODO: return 'border-slate-500 text-slate-400';
    case TaskStatus.IN_PROGRESS: return 'border-blue-500 text-blue-400';
    case TaskStatus.COMPLETED: return 'border-green-500 text-green-400 line-through';
    default: return 'border-slate-600 text-slate-500';
  }
};

const EditIconSmall: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const DeleteIconSmall: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);


const TaskItem: React.FC<TaskItemProps> = ({ task, projectTitle, onEditTaskRequest, onDeleteTask }) => {
  const handleItemClick = () => {
    onEditTaskRequest(task);
  };

  return (
    <div 
      className="bg-slate-800 p-4 rounded-lg shadow-md hover:bg-slate-700/70 transition-all group cursor-pointer hover:shadow-sky-500/20 hover:scale-[1.01]"
      onClick={handleItemClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleItemClick();
        }
      }}
      aria-label={`Edit task: ${task.title}`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start">
        <div className="flex-1 min-w-0 mb-2 sm:mb-0">
          <h3 className={`text-lg font-semibold text-slate-100 truncate group-hover:text-sky-400 ${task.status === TaskStatus.COMPLETED ? 'line-through text-slate-500 group-hover:text-slate-400' : ''}`}>
            {task.title}
          </h3>
          <p className="text-sm text-slate-400 mt-1 truncate">{task.description || 'No description'}</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 self-start sm:self-center">
           <button 
            onClick={(e) => { e.stopPropagation(); onEditTaskRequest(task); }}
            className="p-1.5 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
            aria-label={`Edit task ${task.title}`}
            >
                <EditIconSmall />
            </button>
            <button 
            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
            aria-label={`Delete task ${task.title}`}
            >
                <DeleteIconSmall />
            </button>
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getPriorityClass(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`px-2.5 py-0.5 text-xs font-medium border rounded-full ${getStatusClass(task.status)}`}>
            {task.status.replace('-', ' ')}
          </span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-700 flex flex-col sm:flex-row justify-between text-xs text-slate-400">
        <div>
          Project: <span className="font-medium text-slate-300">{projectTitle}</span>
          <span className="ml-4 text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">Click to edit</span>
        </div>
        <div className="mt-1 sm:mt-0">
          Due: <span className="font-medium text-slate-300">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
       {task.tags && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-slate-600 text-slate-300 rounded-full">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskItem;
