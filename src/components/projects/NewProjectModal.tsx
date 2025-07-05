
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, ProjectContext } from '../../../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: Project) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onAddProject }) => {
  const [title, setTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [goals, setGoals] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [projectContext, setProjectContext] = useState<ProjectContext>(ProjectContext.BUSINESS);
  const [tags, setTags] = useState('');
  const [businessRelevance, setBusinessRelevance] = useState(5);
  const [preferredTimeSlots, setPreferredTimeSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const timeSlotOptions = [
    'early-morning',
    'morning',
    'midday',
    'afternoon',
    'evening',
    'late-evening'
  ];

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setProjectDescription('');
      setGoals('');
      setDeadline('');
      setStatus(ProjectStatus.ACTIVE);
      setProjectContext(ProjectContext.BUSINESS);
      setTags('');
      setBusinessRelevance(5);
      setPreferredTimeSlots([]);
      setIsSubmitting(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTimeSlotToggle = (slot: string) => {
    setPreferredTimeSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setErrorMessage('Project title is required.');
      return;
    }

    if (isSubmitting) return; // Prevent multiple submissions

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const newProjectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
        title: title.trim(),
        context: projectDescription.trim(),
        goals: goals.split('\n').map(goal => goal.trim()).filter(goal => goal),
        deadline: deadline || undefined,
        status,
        project_context: projectContext,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        business_relevance: businessRelevance,
        preferred_time_slots: preferredTimeSlots,
      };
      
      await onAddProject(newProjectData);
      onClose(); // Close modal after successful creation
    } catch (error: any) {
      console.error('Error creating project:', error);
      setErrorMessage(error.message || 'Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
        className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={isSubmitting ? undefined : onClose}
        aria-modal="true"
        role="dialog"
        aria-labelledby="newProjectModalTitle"
    >
      <div
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="newProjectModalTitle" className="text-2xl font-semibold text-sky-400">Create New Project</h2>
          <button 
            onClick={onClose} 
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
          <div>
            <label htmlFor="projectTitle" className="block text-sm font-medium text-slate-300 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="projectTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
              required
              aria-required="true"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-300 mb-1">
              Context <span className="text-sky-400">*</span>
              <span className="block text-xs text-slate-400 font-normal mt-0.5">
                Provide detailed context to help AI understand this project's purpose, goals, and any important background information.
              </span>
            </label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe what this project involves, its objectives, constraints, stakeholders, and any context that would help the AI understand and prioritize this project effectively..."
              rows={3}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="projectGoals" className="block text-sm font-medium text-slate-300 mb-1">Goals (one goal per line)</label>
            <textarea
              id="projectGoals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
              placeholder="e.g., Finalize design mockups&#10;Develop core features&#10;User testing"
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="projectStatus" className="block text-sm font-medium text-slate-300 mb-1">Status</label>
              <select
                id="projectStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
              >
                {Object.values(ProjectStatus).map((statusValue: string) => (
                  <option key={statusValue} value={statusValue}>
                    {statusValue.charAt(0).toUpperCase() + statusValue.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="projectContext" className="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select
                id="projectContext"
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value as ProjectContext)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
              >
                {Object.values(ProjectContext).map((contextValue: string) => (
                  <option key={contextValue} value={contextValue}>
                    {contextValue.charAt(0).toUpperCase() + contextValue.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="projectDeadline" className="block text-sm font-medium text-slate-300 mb-1">Deadline</label>
            <input
              type="date"
              id="projectDeadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
              aria-label="Project deadline"
            />
          </div>
          <div>
            <label htmlFor="businessRelevance" className="block text-sm font-medium text-slate-300 mb-1">
              Business Relevance: {businessRelevance}/10
            </label>
            <input
              type="range"
              id="businessRelevance"
              min="1"
              max="10"
              value={businessRelevance}
              onChange={(e) => setBusinessRelevance(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Low Priority</span>
              <span>High Priority</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Time Slots</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {timeSlotOptions.map((slot) => (
                <label key={slot} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferredTimeSlots.includes(slot)}
                    onChange={() => handleTimeSlotToggle(slot)}
                    className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500 focus:ring-2"
                  />
                  <span className="text-sm text-slate-300 capitalize">
                    {slot.replace('-', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="projectTags" className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              id="projectTags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., development, Q3, client-project"
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-sky-800 disabled:cursor-not-allowed flex items-center justify-center min-w-[130px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
