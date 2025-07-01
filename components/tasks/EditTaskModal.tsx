import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, Project } from '../../types';
import LoadingSpinner from '../LoadingSpinner';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  task: Task;
  projects: Project[];
}

type TaskFormErrors = {
  title?: string;
  estimated_hours?: string;
  due_date?: string;
};

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, onUpdateTask, task, projects }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [selectedProjectIdState, setSelectedProjectIdState] = useState<string | undefined>('standalone');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number | string>(0);
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setSelectedProjectIdState(task.project_id || 'standalone');
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setTags(task.tags.join(', '));
      setEstimatedHours(task.estimated_hours);
      setFormErrors({}); 
      setIsSubmitting(false);
    }
  }, [task, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    const updatedTaskData: Task = {
      ...task, 
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      project_id: selectedProjectIdState === 'standalone' ? undefined : selectedProjectIdState,
      due_date: dueDate || undefined,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      estimated_hours: Number(estimatedHours) || 0,
      updated_at: new Date().toISOString(), // This will be set by App.tsx or Supabase, but good to have
    };
    try {
        await onUpdateTask(updatedTaskData);
    } catch (error) {
        console.error("Error in EditTaskModal submission:", error);
    }
    // App.tsx handles closing and feedback
    // setIsSubmitting(false); // May not be necessary
  };
  
  const handleCloseModal = () => {
    if (isSubmitting) return;
    onClose();
  }

  return (
    <div 
        className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleCloseModal} 
        aria-modal="true"
        role="dialog"
        aria-labelledby="editTaskModalTitle"
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="editTaskModalTitle" className="text-2xl font-semibold text-sky-400">Edit Task</h2>
          <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-200" aria-label="Close modal" disabled={isSubmitting}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editTaskTitle" className="block text-sm font-medium text-slate-300 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="editTaskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500 ${formErrors.title ? 'border-red-500' : ''}`}
              required
              aria-required="true"
              aria-describedby={formErrors.title ? "editTaskTitleError" : undefined}
              disabled={isSubmitting}
            />
            {formErrors.title && <p id="editTaskTitleError" className="text-xs text-red-400 mt-1">{formErrors.title}</p>}
          </div>
          {/* ... other form fields, also add disabled={isSubmitting} ... */}
          <div>
            <label htmlFor="editTaskDescription" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              id="editTaskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="editTaskPriority" className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
              <select
                id="editTaskPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              >
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="editTaskStatus" className="block text-sm font-medium text-slate-300 mb-1">Status</label>
              <select
                id="editTaskStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              >
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
              </select>
            </div>
          </div>
           <div>
              <label htmlFor="editTaskProject" className="block text-sm font-medium text-slate-300 mb-1">Project</label>
              <select
                id="editTaskProject"
                value={selectedProjectIdState}
                onChange={(e) => setSelectedProjectIdState(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              >
                <option value="standalone">Standalone Task</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          <div>
            <label htmlFor="editTaskDueDate" className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
            <input
              type="date"
              id="editTaskDueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500 ${formErrors.due_date ? 'border-red-500' : ''}`}
              aria-describedby={formErrors.due_date ? "editTaskDueDateError" : undefined}
              disabled={isSubmitting}
            />
            {formErrors.due_date && <p id="editTaskDueDateError" className="text-xs text-red-400 mt-1">{formErrors.due_date}</p>}
          </div>
          <div>
            <label htmlFor="editTaskEstimatedHours" className="block text-sm font-medium text-slate-300 mb-1">Estimated Hours</label>
            <input
              type="number"
              id="editTaskEstimatedHours"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value === '' ? '' : parseFloat(e.target.value))}
              min="0"
              step="0.5"
              className={`w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500 ${formErrors.estimated_hours ? 'border-red-500' : ''}`}
              aria-describedby={formErrors.estimated_hours ? "editTaskEstimatedHoursError" : undefined}
              disabled={isSubmitting}
            />
            {formErrors.estimated_hours && <p id="editTaskEstimatedHoursError" className="text-xs text-red-400 mt-1">{formErrors.estimated_hours}</p>}
          </div>
          <div>
            <label htmlFor="editTaskTags" className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              id="editTaskTags"
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
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-sky-800 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="h-5 w-5" /> : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
