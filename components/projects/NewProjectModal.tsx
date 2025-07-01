import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, ProjectContext } from '../../types';
import LoadingSpinner from '../LoadingSpinner';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
}

type ProjectFormErrors = {
  title?: string;
  deadline?: string;
};

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onAddProject }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState(''); 
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [context, setContext] = useState<ProjectContext>(ProjectContext.BUSINESS);
  const [tags, setTags] = useState('');
  const [formErrors, setFormErrors] = useState<ProjectFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setTitle('');
        setDescription('');
        setGoals('');
        setDeadline('');
        setStatus(ProjectStatus.ACTIVE);
        setContext(ProjectContext.BUSINESS);
        setTags('');
        setFormErrors({});
        setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errors: ProjectFormErrors = {};
    if (!title.trim()) {
      errors.title = 'Title is required.';
    }
    if (deadline && isNaN(new Date(deadline).getTime())) {
        errors.deadline = 'Invalid deadline date format.';
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

    const newProjectData: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
      title: title.trim(),
      description: description.trim(),
      goals: goals.split('\n').map(goal => goal.trim()).filter(goal => goal),
      deadline: deadline || undefined,
      status,
      context,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      business_relevance: undefined, 
      preferred_time_slots: undefined,
      user_id: undefined,
    };
    
    try {
      await onAddProject(newProjectData); 
    } catch (error) {
      console.error("Error in NewProjectModal submission:", error);
    }
    // App.tsx will handle closing the modal on success/error and setting feedback
    // setIsSubmitting(false); // May not be necessary if modal is closed by App.tsx
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
        aria-labelledby="newProjectModalTitle"
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="newProjectModalTitle" className="text-2xl font-semibold text-sky-400">Create New Project</h2>
          <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-200" aria-label="Close modal" disabled={isSubmitting}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="projectTitle" className="block text-sm font-medium text-slate-300 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="projectTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500 ${formErrors.title ? 'border-red-500' : ''}`}
              required
              aria-required="true"
              aria-describedby={formErrors.title ? "projectTitleError" : undefined}
              disabled={isSubmitting}
            />
            {formErrors.title && <p id="projectTitleError" className="text-xs text-red-400 mt-1">{formErrors.title}</p>}
          </div>
           {/* ... other form fields, also add disabled={isSubmitting} ... */}
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="projectContext" className="block text-sm font-medium text-slate-300 mb-1">Context</label>
              <select
                id="projectContext"
                value={context}
                onChange={(e) => setContext(e.target.value as ProjectContext)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              >
                {Object.values(ProjectContext).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
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
              className={`w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500 ${formErrors.deadline ? 'border-red-500' : ''}`}
              aria-describedby={formErrors.deadline ? "projectDeadlineError" : undefined}
              disabled={isSubmitting}
            />
            {formErrors.deadline && <p id="projectDeadlineError" className="text-xs text-red-400 mt-1">{formErrors.deadline}</p>}
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
              onClick={handleCloseModal}
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
              {isSubmitting ? <LoadingSpinner size="h-5 w-5" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
