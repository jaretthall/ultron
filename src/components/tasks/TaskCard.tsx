
import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../../../types';

interface TaskCardProps {
  task: Task;
  projectTitle: string;
  onEditTaskRequest: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const getPriorityDotClass = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.URGENT: return 'bg-red-500';
    case TaskPriority.HIGH: return 'bg-orange-500';
    case TaskPriority.MEDIUM: return 'bg-yellow-500';
    case TaskPriority.LOW: return 'bg-sky-500';
    default: return 'bg-slate-500';
  }
};

const getStatusBorderClass = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.TODO: return 'border-slate-600';
    case TaskStatus.IN_PROGRESS: return 'border-blue-500';
    case TaskStatus.COMPLETED: return 'border-green-500';
    default: return 'border-slate-700';
  }
}

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

const TaskCard: React.FC<TaskCardProps> = ({ task, projectTitle, onEditTaskRequest, onDeleteTask }) => {
  const handleCardClick = () => {
    onEditTaskRequest(task);
  };

  return (
    <div 
      className={`bg-slate-800 p-4 rounded-lg shadow-md hover:shadow-sky-500/30 transition-all border-l-4 ${getStatusBorderClass(task.status)} flex flex-col justify-between min-h-[200px] hover:scale-[1.02] hover:bg-slate-750 group`}
      aria-label={`Task: ${task.title}`}
    >
      <div>
        <div className="flex justify-between items-start mb-1">
          <h4 className={`text-md font-semibold text-slate-100 group-hover:text-sky-400 ${task.status === TaskStatus.COMPLETED ? 'line-through text-slate-500' : ''}`}>
            {task.title}
          </h4>
          <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${getPriorityDotClass(task.priority)}`} title={`Priority: ${task.priority}`}></span>
        </div>
        <div className="flex space-x-1 mb-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEditTaskRequest(task); }}
            className="p-1 rounded text-slate-500 hover:text-sky-400 hover:bg-slate-700 focus:outline-none"
            aria-label={`Edit task ${task.title}`}
          >
            <EditIconSmall />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 focus:outline-none"
            aria-label={`Delete task ${task.title}`}
          >
            <DeleteIconSmall />
          </button>
        </div>
        <p className={`text-xs text-slate-400 mb-3 ${task.status === TaskStatus.COMPLETED ? 'line-through' : ''} break-words max-h-16 overflow-hidden`}>
          {task.description || "No description."}
        </p>
      </div>

      <div className="mt-auto">
        {task.tags && task.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map(tag => ( // Show max 3 tags
                <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-300 rounded-full">{tag}</span>
            ))}
            </div>
        )}
        <div className="text-xs text-slate-500 border-t border-slate-700 pt-2">
          <p>Project: <span className="font-medium text-slate-400">{projectTitle}</span></p>
          <p>Due: <span className="font-medium text-slate-400">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</span></p>
          <p>Status: <span className="font-medium text-slate-400">{task.status.replace('-', ' ')}</span></p>
          <p className="text-[10px] text-slate-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to edit</p>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
