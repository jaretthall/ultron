import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, ProjectContext } from '../../../types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject?: (projectId: string) => Promise<void>;
  project: Project;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpdateProject,
  onDeleteProject, 
  project 
}) => {
  const [title, setTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [goals, setGoals] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [projectContext, setProjectContext] = useState<ProjectContext>(ProjectContext.BUSINESS);
  const [tags, setTags] = useState('');
  const [businessRelevance, setBusinessRelevance] = useState(5);
  const [preferredTimeSlots, setPreferredTimeSlots] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const timeSlotOptions = [
    'early-morning',
    'morning',
    'midday',
    'afternoon',
    'evening',
    'late-evening'
  ];

  useEffect(() => {
    if (isOpen && project) {
      setTitle(project.title || '');
      setProjectDescription(project.context || '');
      setGoals(project.goals?.join('\n') || '');
      setDeadline(project.deadline ? project.deadline.split('T')[0] : '');
      setStatus(project.status);
      setProjectContext(project.project_context);
      setTags(project.tags?.join(', ') || '');
      setBusinessRelevance(project.business_relevance || 5);
      setPreferredTimeSlots(project.preferred_time_slots || []);
    }
  }, [isOpen, project]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form on close
      setTitle('');
      setProjectDescription('');
      setGoals('');
      setDeadline('');
      setStatus(ProjectStatus.ACTIVE);
      setProjectContext(ProjectContext.BUSINESS);
      setTags('');
      setBusinessRelevance(5);
      setPreferredTimeSlots([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Project title is required.');
      return;
    }

    const updatedProject: Project = {
      ...project,
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
    onUpdateProject(updatedProject);
  };

  const handleTimeSlotToggle = (slot: string) => {
    setPreferredTimeSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
  };

  const handleDeleteProject = async () => {
    if (onDeleteProject) {
      try {
        await onDeleteProject(project.id);
        onClose();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleMarkCompleted = () => {
    const completedProject: Project = {
      ...project,
      status: ProjectStatus.COMPLETED,
    };
    onUpdateProject(completedProject);
  };

  const getUrgencyScore = () => {
    if (!deadline) return 0;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 100; // Overdue
    if (daysUntil <= 3) return 90;
    if (daysUntil <= 7) return 70;
    if (daysUntil <= 14) return 50;
    if (daysUntil <= 30) return 30;
    return 10;
  };

  const urgencyScore = getUrgencyScore();

  return (
    <div
        className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
        aria-labelledby="editProjectModalTitle"
    >
      <div
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="editProjectModalTitle" className="text-2xl font-semibold text-sky-400">Edit Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Urgency Indicator */}
        {deadline && (
          <div className="mb-4 p-3 rounded-lg bg-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Urgency Score</span>
              <span className={`font-bold ${
                urgencyScore >= 80 ? 'text-red-400' :
                urgencyScore >= 60 ? 'text-orange-400' :
                urgencyScore >= 40 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {urgencyScore}/100
              </span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  urgencyScore >= 80 ? 'bg-red-500' :
                  urgencyScore >= 60 ? 'bg-orange-500' :
                  urgencyScore >= 40 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${urgencyScore}%` }}
              ></div>
            </div>
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
              required
              aria-required="true"
            />
          </div>
          
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
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
              >
                {Object.values(ProjectStatus).map((statusValue: string) => (
                  <option key={statusValue} value={statusValue}>
                    {statusValue.charAt(0).toUpperCase() + statusValue.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="projectContext" className="block text-sm font-medium text-slate-300 mb-1">Context</label>
              <select
                id="projectContext"
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value as ProjectContext)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
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
            />
          </div>
          
          <div className="flex justify-between pt-4">
            <div className="flex space-x-2">
              {project.status !== ProjectStatus.COMPLETED && (
                <button
                  type="button"
                  onClick={handleMarkCompleted}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  Mark Completed
                </button>
              )}
              {onDeleteProject && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Delete Project
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors"
              >
                Update Project
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-400 mb-4">Delete Project</h3>
            <p className="text-slate-300 mb-4">
              Are you sure you want to delete "{project.title}"? This action cannot be undone and will also delete all associated tasks.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProjectModal;