
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus, Project } from '../../../types';
import { useLabels } from '../../hooks/useLabels';
import LoadingSpinner from '../LoadingSpinner';
import { TASK_TEMPLATES } from '../../constants/templates';
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
  const [estimatedHours, setEstimatedHours] = useState<number | string>(0);
  const [progress, setProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flow-based fields for new tasks
  const [microGoals, setMicroGoals] = useState('');
  const [challengeLevel, setChallengeLevel] = useState(5);
  const [engagementStrategy, setEngagementStrategy] = useState('sleep-to-flow');
  const [minimumFlowHours, setMinimumFlowHours] = useState(2);
  const [minimumFlowMinutes, setMinimumFlowMinutes] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(2);
  
  const labels = useLabels();

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

  // Helper functions for flow-based features
  const getChallengeDisplayText = (level: number): string => {
    const messages: { [key: number]: string } = {
      1: "Way too easy (will cause boredom)",
      2: "Too easy (might lose interest)", 
      3: "Slightly easy (good warm-up)",
      4: "Just right (flow sweet spot!)",
      5: "Perfect challenge (4% stretch)",
      6: "Slightly challenging (perfect for flow)",
      7: "Moderately hard (still manageable)",
      8: "Getting difficult (anxiety risk)",
      9: "Too hard (likely overwhelm)",
      10: "Extremely difficult (will cause anxiety)"
    };
    return messages[level] || "Unknown level";
  };

  const getEngagementTip = (strategy: string): string => {
    const tips: { [key: string]: string } = {
      'sleep-to-flow': '⚡ Strategy: Wake up and start this task within 60 seconds, no time to procrastinate',
      'lower-hurdle': '🎯 Strategy: Start with the easiest possible version to build momentum',
      'time-constraint': '⏰ Strategy: Set artificial deadline pressure to increase challenge level',
      'response-inhibition': '🚀 Strategy: Commit to starting before you can think about it'
    };
    return tips[strategy] || '';
  };

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
        // Reset flow-based fields
        setMicroGoals('');
        setChallengeLevel(5);
        setEngagementStrategy('sleep-to-flow');
        setMinimumFlowHours(2);
        setMinimumFlowMinutes(0);
        setEnergyLevel(2);
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
        // Reset flow-based fields (also in else block)
        setMicroGoals('');
        setChallengeLevel(5);
        setEngagementStrategy('sleep-to-flow');
        setMinimumFlowHours(2);
        setMinimumFlowMinutes(0);
        setEnergyLevel(2);
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
      // Reset flow-based fields
      setMicroGoals('');
      setChallengeLevel(5);
      setEngagementStrategy('sleep-to-flow');
      setMinimumFlowHours(2);
      setMinimumFlowMinutes(0);
      setEnergyLevel(2);
      return;
    }

    const template = TASK_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setTitle(template.name);
      setContext(template.context);
      setPriority(template.priority);
      setTags(template.tags.join(', '));
      setEstimatedHours(template.estimated_hours);
      
      // Populate flow-based fields from template
      setMicroGoals(template.microGoals);
      setChallengeLevel(template.challengeLevel);
      setEngagementStrategy(template.engagementStrategy);
      setMinimumFlowHours(template.minimumFlowHours);
      setMinimumFlowMinutes(template.minimumFlowMinutes);
      setEnergyLevel(template.energyLevel);
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
    setDueTime('');
    setIsTimeBlocked(false);
    setScheduledDate('');
    setScheduledStartTime('');
    setScheduledEndTime('');
    setTags('');
    setProgress(0);
    setSelectedTemplate('');
    setErrorMessage('');
    // Reset flow-based fields
    setMicroGoals('');
    setChallengeLevel(5);
    setEngagementStrategy('sleep-to-flow');
    setMinimumFlowHours(2);
    setMinimumFlowMinutes(0);
    setEnergyLevel(2);
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

          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Basic Information Section */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-600 pb-2">
                Basic Information
              </div>

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
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500"
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
                    <p className="text-xs text-slate-300 mb-2">
                      {TASK_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                    </p>
                    <div className="text-xs text-slate-400">
                      <p><strong>Flow Optimization:</strong> Challenge Level {TASK_TEMPLATES.find(t => t.id === selectedTemplate)?.challengeLevel}/10 • {TASK_TEMPLATES.find(t => t.id === selectedTemplate)?.engagementStrategy.replace('-', ' ')} strategy</p>
                      <p className="mt-1"><strong>💡 Anti-Procrastination Tip:</strong> {TASK_TEMPLATES.find(t => t.id === selectedTemplate)?.procrastinationTips}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="taskTitle" className="block text-sm font-medium text-slate-300 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="taskTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter task title..."
                  required
                  disabled={isSubmitting}
                  aria-required="true"
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="microGoals" className="block text-sm font-medium text-slate-300 mb-1">
                  Clear Micro-Goals
                </label>
                <textarea
                  id="microGoals"
                  value={microGoals}
                  onChange={(e) => setMicroGoals(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="Break this down into ridiculously specific steps:&#10;1. Open laptop&#10;2. Navigate to folder&#10;3. Open template&#10;4. Write first bullet point..."
                  disabled={isSubmitting}
                />
                <div className="text-xs text-slate-400 mt-1">
                  ✨ <strong>Flow Tip:</strong> Make each step so easy your brain has nothing to resist
                </div>
              </div>

              <div>
                <label htmlFor="taskContext" className="block text-sm font-medium text-slate-300 mb-1">
                  Context & Why
                  <span className="block text-xs text-slate-400 font-normal mt-0.5">
                    Why does this matter? What's the bigger purpose?
                  </span>
                </label>
                <textarea
                  id="taskContext"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="Why does this matter? What's the bigger purpose? How does it connect to your goals?"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="taskProject" className="block text-sm font-medium text-slate-300 mb-1">Project</label>
                <select
                  id="taskProject"
                  value={selectedProjectIdState}
                  onChange={(e) => setSelectedProjectIdState(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500"
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

            {/* Flow Optimization Section */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-600 pb-2">
                Flow Optimization
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Challenge Level (Sweet Spot Finder)
                </label>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Too Easy (Boredom)</span>
                    <span className="text-green-400 font-semibold">4% Sweet Spot</span>
                    <span>Too Hard (Anxiety)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={challengeLevel}
                    onChange={(e) => setChallengeLevel(Number(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-red-500 rounded-lg appearance-none cursor-pointer"
                    disabled={isSubmitting}
                  />
                  <div className="text-center text-sm text-slate-300 font-medium">
                    {getChallengeDisplayText(challengeLevel)}
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  🎯 <strong>Flow Tip:</strong> Sweet spot is 4% beyond your current skill level
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Engagement Strategy
                </label>
                <select
                  value={engagementStrategy}
                  onChange={(e) => setEngagementStrategy(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isSubmitting}
                >
                  <option value="sleep-to-flow">Sleep-to-Flow (Morning, within 60 seconds)</option>
                  <option value="lower-hurdle">Lower the Hurdle (Start with easier version)</option>
                  <option value="time-constraint">Time Constraint (Artificial deadline pressure)</option>
                  <option value="response-inhibition">Response Inhibition (Bypass thinking)</option>
                </select>
                <div className="text-xs text-slate-400 mt-1">
                  {getEngagementTip(engagementStrategy)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-300 mb-2">Minimum Flow Block</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <input
                      type="number"
                      value={minimumFlowHours}
                      onChange={(e) => setMinimumFlowHours(Number(e.target.value))}
                      min="1"
                      max="8"
                      className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500 text-center"
                      disabled={isSubmitting}
                    />
                    <label className="block text-xs text-slate-400 mt-1">Hours</label>
                  </div>
                  <div className="text-center">
                    <input
                      type="number"
                      value={minimumFlowMinutes}
                      onChange={(e) => setMinimumFlowMinutes(Number(e.target.value))}
                      min="0"
                      max="59"
                      step="15"
                      className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500 text-center"
                      disabled={isSubmitting}
                    />
                    <label className="block text-xs text-slate-400 mt-1">Minutes</label>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  🌊 <strong>Flow Payoff:</strong> Minimum uninterrupted time needed to make struggle worthwhile
                </div>
                
                <div className="mt-3">
                  <div className="text-xs text-slate-400 mb-2">Energy Level Required</div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEnergyLevel(level)}
                        className={`w-3 h-3 rounded-full border-2 transition-colors ${
                          energyLevel >= level 
                            ? 'border-purple-500 bg-purple-500' 
                            : 'border-slate-500 hover:border-purple-400'
                        }`}
                        title={level === 1 ? 'Low energy' : level === 2 ? 'Medium energy' : 'High energy'}
                        disabled={isSubmitting}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Priority & Scheduling Section */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-600 pb-2">
                Priority & Scheduling
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="taskDueDate" className="block text-sm font-medium text-slate-300 mb-1">
                    Due Date (optional)
                  </label>
                  <input
                    type="date"
                    id="taskDueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isSubmitting}
                  />
                  {formErrors.due_date && (
                    <p className="mt-1 text-sm text-red-400">{formErrors.due_date}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="taskDueTime" className="block text-sm font-medium text-slate-300 mb-1">
                    Due Time (optional)
                  </label>
                  <input
                    type="time"
                    id="taskDueTime"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isSubmitting || !dueDate}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {dueDate && !dueTime ? 'Defaults to end of day (11:59 PM)' : dueTime ? 'Deadline will be set for this specific time' : 'Select a date first'}
                  </p>
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
                      This will block time on your calendar and show as a red bar in the week view. AI will schedule around this time.
                    </p>
                    
                    <div>
                      <label htmlFor="taskScheduledDate" className="block text-sm font-medium text-slate-300 mb-1">
                        Scheduled Date
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          End Time (optional)
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
                <label htmlFor="taskTags" className="block text-sm font-medium text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  id="taskTags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., progress-note, therapy, documentation"
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>{labels.newTask}</span>
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
