import React, { useState, useEffect, useMemo } from 'react';
import { Task, Project, TaskStatus, TaskPriority, /*UserPreferences*/ } from '../../../types';
import { useAppState } from '../../contexts/AppStateContext';
import { tasksService } from '../../../services/databaseService';
import { getTaskDependencyStats, /*buildDependencyGraph*/ } from '../../utils/dependencyUtils';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  allTasks: Task[];
  allProjects: Project[];
  isOpen: boolean;
  onUpdate?: (updatedTask: Task) => void;
  onDelete?: (taskId: string) => void;
}

// Icons
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

const ExclamationTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  onClose,
  allTasks,
  // allProjects,
  isOpen
}) => {
  const { updateTask } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDependency, setShowAddDependency] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState('');
  const [dependencies, setDependencies] = useState<Task[]>([]);
  const [dependents, setDependents] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Calculate dependency statistics
  const dependencyStats = useMemo(() => {
    return getTaskDependencyStats(task.id, allTasks);
  }, [task.id, allTasks]);

  // Get available tasks for adding as dependencies (exclude self and completed tasks)
  const availableForDependencies = useMemo(() => {
    return allTasks.filter(t => 
      t.id !== task.id && 
      t.status !== TaskStatus.COMPLETED &&
      !task.dependencies.includes(t.id)
    );
  }, [task.id, task.dependencies, allTasks]);

  // Load dependencies and dependents
  useEffect(() => {
    if (isOpen && task) {
      loadDependencyData();
    }
  }, [isOpen, task.id]);

  const loadDependencyData = async () => {
    try {
      setIsLoading(true);
      const [deps, dependentTasks] = await Promise.all([
        tasksService.getTaskDependencies(task.id),
        tasksService.getTaskDependents(task.id)
      ]);
      setDependencies(deps);
      setDependents(dependentTasks);
    } catch (err) {
      console.error('Error loading dependency data:', err);
      setError('Failed to load dependency information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDependency = async (dependencyId: string) => {
    try {
      setIsLoading(true);
      const updatedTask = {
        ...task,
        dependencies: [...(task.dependencies || []), dependencyId]
      };
      
      // Update the task in the database  
      await tasksService.update(task.id, { dependencies: updatedTask.dependencies });
      
      // Update the task in global state
      await updateTask(task.id, { dependencies: updatedTask.dependencies });
      
      // Reload dependency data
      setShowAddDependency(false);
    } catch (error) {
      console.error('Error adding dependency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    try {
      setIsLoading(true);
      const updatedTask = {
        ...task,
        dependencies: (task.dependencies || []).filter(id => id !== dependencyId)
      };
      
      // Update the task in the database
      await tasksService.update(task.id, { dependencies: updatedTask.dependencies });
      
      // Update the task in global state
      await updateTask(task.id, { dependencies: updatedTask.dependencies });
      
      // Reload dependency data
    } catch (error) {
      console.error('Error removing dependency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'text-red-400 bg-red-900/20';
      case TaskPriority.HIGH: return 'text-orange-400 bg-orange-900/20';
      case TaskPriority.MEDIUM: return 'text-yellow-400 bg-yellow-900/20';
      case TaskPriority.LOW: return 'text-green-400 bg-green-900/20';
      default: return 'text-slate-400 bg-slate-900/20';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'text-green-400 bg-green-900/20';
      case TaskStatus.IN_PROGRESS: return 'text-blue-400 bg-blue-900/20';
      case TaskStatus.TODO: return 'text-slate-400 bg-slate-900/20';
      default: return 'text-slate-400 bg-slate-900/20';
    }
  };

  // Note: Task manipulation handlers removed - using component props for actions

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-semibold text-sky-400">{task.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                {task.status.replace('-', ' ')}
              </span>
              {dependencyStats.isBlocked && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full text-red-400 bg-red-900/20">
                  <ExclamationTriangleIcon />
                  Blocked
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 transition-colors"
            disabled={isLoading}
            aria-label="Close task details modal"
            title="Close modal"
          >
            <XIcon />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Task Description */}
          <div>
            <h3 className="text-lg font-medium text-slate-200 mb-2">Description</h3>
            <p className="text-slate-400">{task.description || 'No description provided'}</p>
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-slate-200 mb-3">Task Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Due Date:</span>
                  <span className="text-slate-300">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Hours:</span>
                  <span className="text-slate-300">{task.estimated_hours || 0}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Energy Level:</span>
                  <span className="text-slate-300">{task.energy_level || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-200 mb-3">Dependency Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Direct Dependencies:</span>
                  <span className="text-slate-300">{dependencyStats.directDependencies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Dependencies:</span>
                  <span className="text-slate-300">{dependencyStats.totalDependencies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tasks Depending on This:</span>
                  <span className="text-slate-300">{dependencyStats.directDependents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Impact:</span>
                  <span className="text-slate-300">{dependencyStats.totalDependents}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dependencies Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                <LinkIcon />
                Dependencies ({dependencies.length})
              </h3>
              <button
                onClick={() => setShowAddDependency(!showAddDependency)}
                className="bg-sky-600 hover:bg-sky-700 text-white text-sm px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
                disabled={isLoading || availableForDependencies.length === 0}
              >
                <PlusIcon />
                Add Dependency
              </button>
            </div>

            {showAddDependency && (
              <div className="bg-slate-700 p-4 rounded-lg mb-4">
                <div className="flex gap-3">
                  <select
                    value={selectedDependency}
                    onChange={e => setSelectedDependency(e.target.value)}
                    className="flex-1 bg-slate-600 border-slate-500 text-slate-100 rounded-md p-2"
                    aria-label="Select task to add as dependency"
                  >
                    <option value="">Select a task...</option>
                    {availableForDependencies.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAddDependency(selectedDependency)}
                    disabled={!selectedDependency || isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDependency(false);
                      setSelectedDependency('');
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {dependencyStats.isBlocked && (
              <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon />
                  <div>
                    <p className="text-red-400 font-medium">This task is blocked</p>
                    <p className="text-red-300 text-sm mt-1">
                      Complete the following dependencies to unblock this task:
                    </p>
                    <ul className="text-red-300 text-sm mt-2 space-y-1">
                      {dependencyStats.blockingTasks.map(blockingTask => (
                        <li key={blockingTask.id}>• {blockingTask.title}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {dependencies.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">No dependencies</p>
              ) : (
                dependencies.map(dep => (
                  <div key={dep.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      {dep.status === TaskStatus.COMPLETED ? (
                        <CheckCircleIcon />
                      ) : (
                        <ExclamationTriangleIcon />
                      )}
                      <div>
                        <span className={`font-medium ${dep.status === TaskStatus.COMPLETED ? 'text-green-400' : 'text-slate-300'}`}>
                          {dep.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(dep.priority)}`}>
                            {dep.priority}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(dep.status)}`}>
                            {dep.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDependency(dep.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                      disabled={isLoading}
                      title="Remove dependency"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dependents Section */}
          {dependents.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-slate-200 mb-3">Tasks Depending on This ({dependents.length})</h3>
              <div className="space-y-2">
                {dependents.map(dependent => (
                  <div key={dependent.id} className="flex items-center gap-3 bg-slate-700 p-3 rounded-lg">
                    <LinkIcon />
                    <div>
                      <span className="font-medium text-slate-300">{dependent.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(dependent.priority)}`}>
                          {dependent.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(dependent.status)}`}>
                          {dependent.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-slate-200 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 text-sm bg-slate-600 text-slate-300 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div>
              <h3 className="text-lg font-medium text-slate-200 mb-3">Notes</h3>
              <p className="text-slate-400 whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal; 