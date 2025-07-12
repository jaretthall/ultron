
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus, Project } from '../../../types';
import LoadingSpinner from '../LoadingSpinner';
import { TASK_TEMPLATES, TaskTemplate } from '../../constants/templates';
// Phase 6: Security and monitoring integration
import { InputValidator } from '../../utils/securityUtils';
import { trackUserInteraction, captureException, ErrorCategory, ErrorSeverity } from '../../services/monitoringService';

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
  const [context, setContext] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [selectedProjectIdState, setSelectedProjectIdState] = useState<string>(
    defaultProjectId && projects.find(p => p.id === defaultProjectId) ? defaultProjectId : 'standalone'
  );
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number | string>(0);
  const [progress, setProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out temporary projects (those with IDs starting with 'temp_')
  const availableProjects = useMemo(() => projects.filter(p => !p.id.startsWith('temp_')), [projects]);

  // Get relevant task templates based on selected project
  const relevantTemplates = useMemo(() => {
    if (selectedProjectIdState === 'standalone') {
      return TASK_TEMPLATES;
    }
    
    const selectedProject = availableProjects.find(p => p.id === selectedProjectIdState);
    if (!selectedProject) return TASK_TEMPLATES;
    
    // Filter templates based on project type and context
    return TASK_TEMPLATES.filter(template => {
      // Show all templates for business projects
      if (selectedProject.project_context === 'business') {
        return true;
      }
      
      // For personal projects, show templates that don't require business context
      return !template.project_context || template.project_context === selectedProject.project_context;
    });
  }, [selectedProjectIdState, availableProjects]);

  useEffect(() => {
    if (isOpen) {
        setSelectedProjectIdState(
            defaultProjectId && availableProjects.find(p => p.id === defaultProjectId) ? defaultProjectId : 'standalone'
        );
        setDueDate(defaultDueDate || '');
        setTitle('');
        setContext('');
        setPriority(TaskPriority.MEDIUM);
        setTags('');
        setEstimatedHours(0);
        setProgress(0);
        setSelectedTemplate('');
        setFormErrors({});
        setErrorMessage('');
    } else {
        setTitle('');
        setContext('');
        setPriority(TaskPriority.MEDIUM);
        setSelectedProjectIdState(
            defaultProjectId && availableProjects.find(p => p.id === defaultProjectId) ? defaultProjectId : 'standalone'
        );
        setDueDate(defaultDueDate || '');
        setTags('');
        setEstimatedHours(0);
        setProgress(0);
        setSelectedTemplate('');
        setFormErrors({});
        setErrorMessage('');
    }
  }, [isOpen, defaultProjectId, defaultDueDate, availableProjects]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId === '') {
      // Reset to defaults
      setTitle('');
      setContext('');
      setPriority(TaskPriority.MEDIUM);
      setTags('');
      setEstimatedHours(0);
      return;
    }

    const template = TASK_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setTitle(template.name);
      setContext(template.context);
      setPriority(template.priority);
      setTags(template.tags.join(', '));
      setEstimatedHours(template.estimated_hours);
    }
  };

  if (!isOpen) return null;

  // const validateForm = (): boolean => {
  //   const errors: TaskFormErrors = {};
  //   if (!title.trim()) {
  //     errors.title = 'Title is required.';
  //   }
  //   if (estimatedHours !== '' && (isNaN(Number(estimatedHours)) || Number(estimatedHours) < 0)) {
  //     errors.estimated_hours = 'Estimated hours must be a non-negative number.';
  //   }
  //   if (dueDate && isNaN(new Date(dueDate).getTime())) {
  //       errors.due_date = 'Invalid due date format.';
  //   }
  //   setFormErrors(errors);
  //   return Object.keys(errors).length === 0;
  // };

  const resetFormAndClose = () => {
    setTitle('');
    setContext('');
    setPriority(TaskPriority.MEDIUM);
    setSelectedProjectIdState(
        defaultProjectId && availableProjects.find(p => p.id === defaultProjectId) ? defaultProjectId : 'standalone'
    );
    setDueDate(defaultDueDate || '');
    setTags('');
    setProgress(0);
    setSelectedTemplate('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Phase 6: Enhanced security validation
      const titleValidation = InputValidator.validateTitle(title);
      const contextValidation = InputValidator.validateDescription(context);
      
      if (!titleValidation.valid) {
        setErrorMessage(titleValidation.error || 'Task title is required.');
        trackUserInteraction('form_validation_error', 'new_task_modal', { error: 'invalid_title' });
        return;
      }
      
      if (!contextValidation.valid) {
        setErrorMessage(contextValidation.error || 'Task context is invalid.');
        trackUserInteraction('form_validation_error', 'new_task_modal', { error: 'invalid_context' });
        return;
      }

      // Validate estimated hours
      const estimatedHoursNum = Number(estimatedHours) || 0;
      if (estimatedHoursNum < 0 || estimatedHoursNum > 24) {
        setErrorMessage('Estimated hours must be between 0 and 24.');
        trackUserInteraction('form_validation_error', 'new_task_modal', { error: 'invalid_hours' });
        return;
      }

      setIsSubmitting(true);
      setErrorMessage('');

      // Sanitize inputs
      const sanitizedTitle = InputValidator.sanitizeInput(title.trim());
      const sanitizedContext = InputValidator.sanitizeInput(context.trim());
      const sanitizedTags = tags.split(',')
        .map(tag => InputValidator.sanitizeInput(tag.trim()))
        .filter(tag => tag);

      const newTaskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
        title: sanitizedTitle,
        context: sanitizedContext,
        priority,
        status: TaskStatus.TODO,
        estimated_hours: estimatedHoursNum,
        dependencies: [],
        project_id: selectedProjectIdState === 'standalone' ? undefined : selectedProjectIdState,
        due_date: dueDate || undefined,
        tags: sanitizedTags,
        progress: progress,
      };

      trackUserInteraction('task_creation_attempted', 'new_task_modal', { 
        priority, 
        hasProject: !!newTaskData.project_id,
        estimatedHours: estimatedHoursNum,
        tagCount: sanitizedTags.length,
        templateUsed: selectedTemplate
      });

      await onAddTask(newTaskData);
      trackUserInteraction('task_created_successfully', 'new_task_modal');
      resetFormAndClose();
      
    } catch (error: any) {
      console.error('Error creating task:', error);
      captureException(error, {
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.MEDIUM,
        additionalData: { 
          operation: 'create_task_modal',
          formData: { title, priority, hasProject: selectedProjectIdState !== 'standalone' }
        }
      });
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
            onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 id="newTaskModalTitle" className="text-2xl font-semibold text-sky-400">Add New Task</h2>
            <button 
                onClick={handleCloseModal} 
                className="text-slate-400 hover:text-slate-200" 
                aria-label="Close modal"
                disabled={isSubmitting}
            >
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Template Selection */}
            <div>
              <label htmlFor="taskTemplate" className="block text-sm font-medium text-slate-300 mb-1">
                Task Template
                <span className="block text-xs text-slate-400 font-normal mt-0.5">
                  Choose a template to pre-fill common task types, or start from scratch.
                </span>
              </label>
              <select
                id="taskTemplate"
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              >
                <option value="">Start from scratch</option>
                {relevantTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="mt-2 p-3 bg-slate-700/50 rounded-md">
                  <p className="text-xs text-slate-300">
                    {TASK_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="taskTitle" className="block text-sm font-medium text-slate-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="taskTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                required
                disabled={isSubmitting}
                aria-required="true"
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-400">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="taskContext" className="block text-sm font-medium text-slate-300 mb-1">
                Context/Description
                <span className="block text-xs text-slate-400 font-normal mt-0.5">
                  Provide detailed context to help with task execution and AI understanding.
                </span>
              </label>
              <textarea
                id="taskContext"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Describe what needs to be done, any constraints, requirements, or important details..."
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
                  {Object.values(TaskPriority).map((priorityValue) => (
                    <option key={priorityValue} value={priorityValue}>
                      {priorityValue.charAt(0).toUpperCase() + priorityValue.slice(1)}
                    </option>
                  ))}
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
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="taskEstimatedHours" className="block text-sm font-medium text-slate-300 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  id="taskEstimatedHours"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  min="0"
                  max="24"
                  step="0.5"
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                  disabled={isSubmitting}
                />
                {formErrors.estimated_hours && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.estimated_hours}</p>
                )}
              </div>

              <div>
                <label htmlFor="taskDueDate" className="block text-sm font-medium text-slate-300 mb-1">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  id="taskDueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                  disabled={isSubmitting}
                />
                {formErrors.due_date && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.due_date}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="taskTags" className="block text-sm font-medium text-slate-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                id="taskTags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., urgent, review, development"
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Task</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
};

export default NewTaskModal;
