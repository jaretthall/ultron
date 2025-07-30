import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../../types';

interface ClinicalNotesAlertProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const ClinicalNotesAlert: React.FC<ClinicalNotesAlertProps> = ({ tasks, onTaskClick }) => {
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

  // Helper function to check if task is due today
  const isDueToday = (task: Task): boolean => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  };

  // Filter clinical notes that need attention
  const clinicalNotes = tasks.filter(task => 
    isClinicalNote(task) && 
    task.status !== TaskStatus.COMPLETED
  );

  const overdueClinicalNotes = clinicalNotes.filter(isOverdue);
  const dueTodayClinicalNotes = clinicalNotes.filter(isDueToday);
  const urgentClinicalNotes = clinicalNotes.filter(task => 
    task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT
  );

  // Don't show component if no clinical notes need attention
  if (clinicalNotes.length === 0) {
    return null;
  }

  const getTaskUrgencyLevel = (task: Task): 'critical' | 'warning' | 'info' => {
    if (isOverdue(task)) return 'critical';
    if (isDueToday(task) || task.priority === TaskPriority.URGENT) return 'warning';
    return 'info';
  };

  const getUrgencyStyles = (level: 'critical' | 'warning' | 'info') => {
    switch (level) {
      case 'critical':
        return {
          border: 'border-red-500',
          bg: 'bg-red-900/20',
          text: 'text-red-300',
          icon: 'text-red-400',
          pulse: 'animate-pulse'
        };
      case 'warning':
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-900/20',
          text: 'text-amber-300',
          icon: 'text-amber-400',
          pulse: ''
        };
      default:
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-900/20',
          text: 'text-blue-300',
          icon: 'text-blue-400',
          pulse: ''
        };
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-red-500">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <span className="mr-2">📋</span>
              Clinical Documentation Alert
              {overdueClinicalNotes.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                  {overdueClinicalNotes.length} OVERDUE
                </span>
              )}
            </h3>
            <div className="text-sm text-slate-400">
              {clinicalNotes.length} pending note{clinicalNotes.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{overdueClinicalNotes.length}</div>
              <div className="text-xs text-red-300">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{dueTodayClinicalNotes.length}</div>
              <div className="text-xs text-amber-300">Due Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{urgentClinicalNotes.length}</div>
              <div className="text-xs text-blue-300">High Priority</div>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {clinicalNotes.slice(0, 5).map(task => {
              const urgency = getTaskUrgencyLevel(task);
              const styles = getUrgencyStyles(urgency);
              
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-all ${styles.bg} ${styles.border} ${styles.pulse}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${styles.text} truncate`}>
                        {task.title}
                      </p>
                      <div className="flex items-center space-x-3 mt-1">
                        {task.due_date && (
                          <span className={`text-xs ${styles.text}`}>
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === TaskPriority.URGENT ? 'bg-red-600 text-white' :
                          task.priority === TaskPriority.HIGH ? 'bg-orange-600 text-white' :
                          'bg-slate-600 text-slate-300'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <div className={`flex-shrink-0 ml-3 ${styles.icon}`}>
                      {urgency === 'critical' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      )}
                      {urgency === 'warning' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {urgency === 'info' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {clinicalNotes.length > 5 && (
            <div className="mt-3 text-center">
              <span className="text-sm text-slate-400">
                +{clinicalNotes.length - 5} more clinical note{clinicalNotes.length - 5 !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end space-x-2">
            <button className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded transition-colors">
              View All Notes
            </button>
            <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors">
              Create Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalNotesAlert;