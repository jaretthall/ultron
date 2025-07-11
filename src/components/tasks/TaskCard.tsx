
import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../../../types';

interface TaskCardProps {
  task: Task;
  projectTitle: string;
  onEditTaskRequest: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
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

const CheckIconSmall: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UndoIconSmall: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

const ClinicalNoteIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const TaskCard: React.FC<TaskCardProps> = ({ task, projectTitle, onEditTaskRequest, onDeleteTask, onCompleteTask }) => {
  // Helper function to identify clinical/progress note tasks
  const isClinicalNote = (task: Task): boolean => {
    return task.tags?.includes('progress-note') ||
           task.tags?.includes('therapy') ||
           task.tags?.includes('documentation') ||
           task.title.toLowerCase().includes('progress note') ||
           task.title.toLowerCase().includes('clinical') ||
           task.title.toLowerCase().includes('therapy note');
  };

  // Helper function to check if task is overdue
  const isOverdue = (task: Task): boolean => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const isClinical = isClinicalNote(task);
  const taskOverdue = isOverdue(task);
  
  // Special styling for clinical notes
  const getCardClasses = () => {
    let baseClasses = `p-4 rounded-lg shadow-md transition-all border-l-4 flex flex-col justify-between min-h-[200px] hover:scale-[1.02] group`;
    
    if (isClinical) {
      if (taskOverdue && task.status !== TaskStatus.COMPLETED) {
        return `${baseClasses} bg-red-900/30 border-red-400 hover:shadow-red-400/50 shadow-red-500/20 animate-pulse ring-2 ring-red-500/30`;
      } else if (task.status !== TaskStatus.COMPLETED) {
        return `${baseClasses} bg-blue-900/30 border-blue-400 hover:shadow-blue-400/50 shadow-blue-500/20 ring-1 ring-blue-500/20`;
      }
    }
    
    return `${baseClasses} bg-slate-800 hover:shadow-sky-500/30 hover:bg-slate-750 ${getStatusBorderClass(task.status)}`;
  };

  return (
    <div 
      className={getCardClasses()}
      aria-label={`Task: ${task.title}`}
    >
      <div>
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            {isClinical && (
              <div className={`flex-shrink-0 mt-0.5 ${taskOverdue && task.status !== TaskStatus.COMPLETED ? 'text-red-300' : 'text-blue-300'}`}>
                <ClinicalNoteIcon />
              </div>
            )}
            <h4 className={`text-md font-semibold flex-1 ${
              isClinical 
                ? taskOverdue && task.status !== TaskStatus.COMPLETED 
                  ? 'text-red-100 group-hover:text-red-200' 
                  : 'text-blue-100 group-hover:text-blue-200'
                : 'text-slate-100 group-hover:text-sky-400'
            } ${task.status === TaskStatus.COMPLETED ? 'line-through text-slate-500' : ''}`}>
              {task.title}
              {isClinical && taskOverdue && task.status !== TaskStatus.COMPLETED && (
                <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                  OVERDUE
                </span>
              )}
            </h4>
          </div>
          <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${getPriorityDotClass(task.priority)}`} title={`Priority: ${task.priority}`}></span>
        </div>
        <div className="flex space-x-1 mb-2">
          {onCompleteTask && (
                      <button 
            onClick={(e) => { e.stopPropagation(); onCompleteTask(task.id); }}
            className={`p-1 rounded focus:outline-none ${
              task.status === TaskStatus.COMPLETED 
                ? 'text-green-500 hover:text-yellow-400 hover:bg-slate-700' 
                : 'text-slate-500 hover:text-green-400 hover:bg-slate-700'
            }`}
            aria-label={task.status === TaskStatus.COMPLETED ? `Mark task ${task.title} as incomplete` : `Mark task ${task.title} as complete`}
            title={task.status === TaskStatus.COMPLETED ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.status === TaskStatus.COMPLETED ? <UndoIconSmall /> : <CheckIconSmall />}
            </button>
          )}
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
          {task.title || "No description."}
        </p>
        
        {/* Progress Bar */}
        {task.progress !== undefined && task.progress > 0 && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400">Progress</span>
              <span className="text-xs font-medium text-slate-300">{task.progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div 
                className="bg-sky-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto">
        {task.tags && task.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map(tag => {
              const isClinicalTag = ['progress-note', 'therapy', 'documentation', 'clinical'].includes(tag.toLowerCase());
              return (
                <span 
                  key={tag} 
                  className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                    isClinicalTag 
                      ? 'bg-blue-600/80 text-blue-100 border border-blue-400/50' 
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tag}
                </span>
              );
            })}
            </div>
        )}
        <div className={`text-xs border-t pt-2 ${isClinical ? 'border-blue-600/30' : 'border-slate-700'} text-slate-500`}>
          <p>Project: <span className="font-medium text-slate-400">{projectTitle}</span></p>
          <p>Due: <span className={`font-medium ${
            isClinical && taskOverdue && task.status !== TaskStatus.COMPLETED 
              ? 'text-red-300 animate-pulse' 
              : isClinical 
                ? 'text-blue-300' 
                : 'text-slate-400'
          }`}>
            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
            {isClinical && taskOverdue && task.status !== TaskStatus.COMPLETED && (
              <span className="ml-1 text-red-400">⚠️</span>
            )}
          </span></p>
          <p>Status: <span className={`font-medium ${isClinical ? 'text-blue-300' : 'text-slate-400'}`}>{task.status.replace('-', ' ')}</span></p>
          {isClinical && (
            <p className="text-[10px] text-blue-400 mt-1 font-medium">📋 Clinical Documentation</p>
          )}
          <p className="text-[10px] text-slate-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to edit</p>
        </div>
      </div>
    </div>
  );
};

// Memoize TaskCard for performance optimization
export default React.memo(TaskCard, (prevProps, nextProps) => {
  // Optimize re-renders by checking specific properties
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.updated_at === nextProps.task.updated_at &&
    prevProps.projectTitle === nextProps.projectTitle &&
    prevProps.onEditTaskRequest === nextProps.onEditTaskRequest &&
    prevProps.onDeleteTask === nextProps.onDeleteTask
  );
});
