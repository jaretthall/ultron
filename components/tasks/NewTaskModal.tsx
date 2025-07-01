import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, Project } from '../../types';
import LoadingSpinner from '../LoadingSpinner';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  projects: Project[];
  defaultProjectId?: string;
  defaultDueDate?: string; 
}

type TaskFormErrors = {
  title?: string;
  estimated_hours?: string;
  due_date?: string;
};

const NewTaskModal: React.FC<NewTaskModalProps> = ({ 
    isOpen, 
    onClose, 
    onAddTask, 
    projects, 
    defaultProjectId,
    defaultDueDate 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [selectedProjectIdState, setSelectedProjectIdState] = useState<string>(
    defaultProjectId && projects.find(p => p.id === defaultProjectId) ? defaultProjectId : 'standalone'
  );
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number | string>(0);
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out temporary projects (those with IDs starting with 'temp_')
  const availableProjects = projects.filter(p => !p.id.startsWith('temp_'));

  useEffect(() => {
    const filteredProjects = projects.filter(p => !p.id.startsWith('temp_'));
    if (isOpen) {
        setSelectedProjectIdState(
            defaultProjectId && filteredProjects.find(p => p.id === defaultProjectId) ? defaultProjectId : 'standalone'
        );
        setDueDate(defaultDueDate || '');
        setTitle('');
        setDescription('');
        setPriority(TaskPriority.MEDIUM);
        setTags('');
        setEstimatedHours(0);
        setFormErrors({});
        setErrorMessage('');
    } else {
        setTitle('');
        setDescription('');
        setPriority(TaskPriority.MEDIUM);
        setSelectedProjectIdState(
            defaultProjectId && filteredProjects.find(p => p.id === defaultProjectId) ? defaultProjectId : 'standalone'
        );
        setDueDate(defaultDueDate || '');
        setTags('');
        setEstimatedHours(0);
        setFormErrors({});
        setErrorMessage('');
    }
  }, [isOpen, defaultProjectId, defaultDueDate, projects]);


  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errors: TaskFormErrors = {};
    if (!title.trim()) {
      errors.title = 'Title is required.';
    }
    if (estimatedHours !== '' && (isNaN(Number(estimatedHours)) || Number(estimatedHours) < 0)) {
      errors.estimated_hours = 'Estimated hours must be a non-negative number.';
    }
    if (dueDate && isNaN(new Date(dueDate).getTime())) {
        errors.due_date = 'Invalid due date format.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetFormAndClose = () => {
    setTitle('');
    setDescription('');
    setPriority(TaskPriority.MEDIUM);
    setSelectedProjectIdState(
        defaultProjectId && availableProjects.find(p => p.id === defaultProjectId) ? defaultProjectId : 'standalone'
    );
    setDueDate(defaultDueDate || '');
    setTags('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const newTaskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status: TaskStatus.TODO,
      estimated_hours: Number(estimatedHours) || 0,
      dependencies: [],
      project_id: selectedProjectIdState === 'standalone' ? undefined : selectedProjectIdState,
      due_date: dueDate || undefined,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    try {
      await onAddTask(newTaskData);
      resetFormAndClose();
    } catch (error: any) {
      console.error('Error creating task:', error);
      setErrorMessage(error.message || 'Failed to create task. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return; // Prevent closing if submitting
    resetFormAndClose();
  }

  return (
    <div 
        className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleCloseModal} 
        aria-modal="true"
        role="dialog"
        aria-labelledby="newTaskModalTitle"
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="newTaskModalTitle" className="text-2xl font-semibold text-sky-400">Create New Task</h2>
          <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-200" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-800/20 border border-red-600 rounded-lg">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        {availableProjects.length === 0 && projects.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-800/20 border border-yellow-600 rounded-lg">
            <p className="text-yellow-400 text-sm">
              Some projects are still being saved. Wait for them to finish before creating tasks.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="taskTitle" className="block text-sm font-medium text-slate-300 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500 ${formErrors.title ? 'border-red-500' : ''}`}
              required
              aria-required="true"
              aria-describedby={formErrors.title ? "taskTitleError" : undefined}
              disabled={isSubmitting}
            />
            {formErrors.title && <p id="taskTitleError" className="text-xs text-red-400 mt-1">{formErrors.title}</p>}
          </div>
          <div>
            <label htmlFor="taskDescription" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="taskPriority" className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
              <select
                id="taskPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              >
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="taskProject" className="block text-sm font-medium text-slate-300 mb-1">Project</label>
              <select
                id="taskProject"
                value={selectedProjectIdState}
                onChange={(e) => setSelectedProjectIdState(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              >
                <option value="standalone">Standalone Task</option>
                {availableProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="taskDueDate" className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
            <input
              type="date"
              id="taskDueDate"
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)}
              className={`w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500 ${formErrors.due_date ? 'border-red-500' : ''}`}
              aria-describedby={formErrors.due_date ? "taskDueDateError" : undefined}
              disabled={isSubmitting}
            />
            {formErrors.due_date && <p id="taskDueDateError" className="text-xs text-red-400 mt-1">{formErrors.due_date}</p>}
          </div>
           <div>
            <label htmlFor="taskEstimatedHours" className="block text-sm font-medium text-slate-300 mb-1">Estimated Hours</label>
            <input
              type="number"
              id="taskEstimatedHours"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value === '' ? '' : parseFloat(e.target.value))}
              min="0"
              step="0.5"
              className={`w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500 ${formErrors.estimated_hours ? 'border-red-500' : ''}`}
              aria-describedby={formErrors.estimated_hours ? "taskEstimatedHoursError" : undefined}
              disabled={isSubmitting}
            />
            {formErrors.estimated_hours && <p id="taskEstimatedHoursError" className="text-xs text-red-400 mt-1">{formErrors.estimated_hours}</p>}
          </div>
          <div>
            <label htmlFor="taskTags" className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              id="taskTags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., urgent, design, frontend"
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-sky-800 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="h-5 w-5" /> : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;
