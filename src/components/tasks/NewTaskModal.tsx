
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus, Project } from '../../../types';
import { useLabels } from '../../hooks/useLabels';
import LoadingSpinner from '../LoadingSpinner';
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
  const [dueTime, setDueTime] = useState('');
  
  // Task scheduling fields
  const [isTimeBlocked, setIsTimeBlocked] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  const [tags, setTags] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number | string>(1);
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const labels = useLabels();

  // Filter out temporary projects (those with IDs starting with 'temp_')
  const availableProjects = useMemo(() => projects.filter(p => !p.id.startsWith('temp_')), [projects]);

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
        setEstimatedHours(1);
        setFormErrors({});
        setErrorMessage('');
        setIsTimeBlocked(false);
        setScheduledDate('');
        setScheduledStartTime('');
        setScheduledEndTime('');
        setDueTime('');
    }
  }, [isOpen, defaultProjectId, defaultDueDate, availableProjects]);

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
    setDueTime('');
    setIsTimeBlocked(false);
    setScheduledDate('');
    setScheduledStartTime('');
    setScheduledEndTime('');
    setTags('');
    setEstimatedHours(1);
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

      // Combine date and time for due_date (ensure timezone consistency)
      let combinedDueDate: string | undefined = undefined;
      if (dueDate) {
        if (dueTime) {
          // Create a Date object in local time, then convert to ISO string
          const localDateTime = new Date(`${dueDate}T${dueTime}:00`);
          combinedDueDate = localDateTime.toISOString();
        } else {
          // Default to end of day in local time
          const localDateTime = new Date(`${dueDate}T23:59:59`);
          combinedDueDate = localDateTime.toISOString();
        }
      }

      // Combine scheduled date and times (ensure timezone consistency)
      let combinedScheduledStart: string | undefined = undefined;
      let combinedScheduledEnd: string | undefined = undefined;
      if (isTimeBlocked && scheduledDate && scheduledStartTime) {
        const localStartDateTime = new Date(`${scheduledDate}T${scheduledStartTime}:00`);
        combinedScheduledStart = localStartDateTime.toISOString();
        if (scheduledEndTime) {
          const localEndDateTime = new Date(`${scheduledDate}T${scheduledEndTime}:00`);
          combinedScheduledEnd = localEndDateTime.toISOString();
        } else {
          // Default to 1 hour duration if no end time specified
          const endTime = new Date(localStartDateTime);
          endTime.setHours(endTime.getHours() + 1);
          combinedScheduledEnd = endTime.toISOString();
        }
      }

      const newTaskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
        title: sanitizedTitle,
        context: sanitizedContext,
        priority,
        status: TaskStatus.TODO,
        estimated_hours: estimatedHoursNum,
        dependencies: [],
        project_id: selectedProjectIdState === 'standalone' ? undefined : selectedProjectIdState,
        due_date: combinedDueDate,
        scheduled_start: combinedScheduledStart,
        scheduled_end: combinedScheduledEnd,
        is_time_blocked: isTimeBlocked,
        tags: sanitizedTags,
        progress: 0,
      };

      trackUserInteraction('task_creation_attempted', 'new_task_modal', { 
        priority, 
        hasProject: !!newTaskData.project_id,
        estimatedHours: estimatedHoursNum,
        tagCount: sanitizedTags.length
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto"
          onClick={handleCloseModal} 
          aria-modal="true"
          role="dialog"
          aria-labelledby="newTaskModalTitle"
      >
        <div 
            className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden w-full max-w-2xl mx-4 my-4 sm:my-8 min-h-fit max-h-[95vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <h2 id="newTaskModalTitle" className="text-xl font-semibold">{labels.newTask}</h2>
              <button 
                  onClick={handleCloseModal} 
                  className="w-8 h-8 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                  aria-label="Close modal"
                  disabled={isSubmitting}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-800/20 border border-red-600 rounded-lg">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-300 border-b border-slate-600 pb-2">
                Task Details
              </h3>

              <div>
                <label htmlFor="taskTitle" className="block text-sm font-medium text-slate-300 mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="taskTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="What needs to be done?"
                  required
                  disabled={isSubmitting}
                  aria-required="true"
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="taskContext" className="block text-sm font-medium text-slate-300 mb-2">
                  Description & Context
                  <span className="block text-xs text-slate-400 font-normal mt-1">
                    Describe what needs to be done, why it matters, and any important details.
                  </span>
                </label>
                <textarea
                  id="taskContext"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Provide context, goals, and any important details about this task..."
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="taskProject" className="block text-sm font-medium text-slate-300 mb-2">Project</label>
                <select
                  id="taskProject"
                  value={selectedProjectIdState}
                  onChange={(e) => setSelectedProjectIdState(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500"
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

            {/* Priority & Scheduling */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-300 border-b border-slate-600 pb-2">
                Priority & Scheduling
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Priority Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(TaskPriority).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level)}
                      className={`px-3 py-2 rounded text-xs font-medium uppercase tracking-wide transition-colors border-2 ${
                        priority === level
                          ? level === 'low' ? 'bg-green-600 border-green-500 text-white'
                          : level === 'medium' ? 'bg-yellow-600 border-yellow-500 text-white'
                          : level === 'high' ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-purple-600 border-purple-500 text-white'
                          : level === 'low' ? 'border-green-500 text-green-400 hover:bg-green-600 hover:text-white'
                          : level === 'medium' ? 'border-yellow-500 text-yellow-400 hover:bg-yellow-600 hover:text-white'
                          : level === 'high' ? 'border-red-500 text-red-400 hover:bg-red-600 hover:text-white'
                          : 'border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white'
                      }`}
                      disabled={isSubmitting}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="estimatedHours" className="block text-sm font-medium text-slate-300 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    id="estimatedHours"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    min="0.25"
                    max="24"
                    step="0.25"
                    className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="taskDueDate" className="block text-sm font-medium text-slate-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="taskDueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="taskDueTime" className="block text-sm font-medium text-slate-300 mb-2">
                    Due Time
                  </label>
                  <input
                    type="time"
                    id="taskDueTime"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isSubmitting || !dueDate}
                  />
                </div>
              </div>

              {/* Time Blocking Section */}
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="taskTimeBlocked"
                    checked={isTimeBlocked}
                    onChange={(e) => setIsTimeBlocked(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="taskTimeBlocked" className="text-sm font-medium text-slate-300">
                    Schedule this task at a specific time
                  </label>
                </div>
                
                {isTimeBlocked && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                      This will block time on your calendar and show as a scheduled work session.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="taskScheduledDate" className="block text-sm font-medium text-slate-300 mb-1">
                          Date
                      </label>
                      <input
                        type="date"
                        id="taskScheduledDate"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    
                      <div>
                        <label htmlFor="taskScheduledStartTime" className="block text-sm font-medium text-slate-300 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          id="taskScheduledStartTime"
                          value={scheduledStartTime}
                          onChange={(e) => setScheduledStartTime(e.target.value)}
                          className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500"
                          disabled={isSubmitting || !scheduledDate}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="taskScheduledEndTime" className="block text-sm font-medium text-slate-300 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          id="taskScheduledEndTime"
                          value={scheduledEndTime}
                          onChange={(e) => setScheduledEndTime(e.target.value)}
                          className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500"
                          disabled={isSubmitting || !scheduledDate || !scheduledStartTime}
                        />
                        <p className="mt-1 text-xs text-slate-400">
                          {scheduledStartTime && !scheduledEndTime ? 'Defaults to 1 hour duration' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="taskTags" className="block text-sm font-medium text-slate-300 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  id="taskTags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., urgent, meeting, research"
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
      </div>
    );
};

export default NewTaskModal;
