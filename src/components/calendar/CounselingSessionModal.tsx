import React, { useState } from 'react';
import { Schedule, Task, Project, TaskPriority, TaskStatus } from '../../../types';
import { formatDateForInput } from '../../utils/dateUtils';
import LoadingSpinner from '../LoadingSpinner';

interface CounselingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCounselingSession: (
    session: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>,
    progressNote: Omit<Task, 'id' | 'created_at' | 'updated_at'>
  ) => void;
  projects: Project[];
  defaultDate?: Date;
}

const CounselingSessionModal: React.FC<CounselingSessionModalProps> = ({
  isOpen,
  onClose,
  onAddCounselingSession,
  projects,
  defaultDate
}) => {
  const [title, setTitle] = useState('Counseling Session');
  const [context, setContext] = useState('Individual therapy session');
  const [date, setDate] = useState(defaultDate ? formatDateForInput(defaultDate) : '');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('Office');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setTitle('Counseling Session');
    setContext('Individual therapy session');
    setDate(defaultDate ? formatDateForInput(defaultDate) : '');
    setStartTime('10:00');
    setEndTime('11:00');
    setLocation('Office');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setErrorMessage('Session title is required.');
      return;
    }

    if (!date) {
      setErrorMessage('Date is required.');
      return;
    }

    if (!startTime || !endTime) {
      setErrorMessage('Start and end times are required.');
      return;
    }

    if (startTime >= endTime) {
      setErrorMessage('End time must be after start time.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const startDateTime = `${date}T${startTime}`;
      const endDateTime = `${date}T${endTime}`;

      const counselingSession: Omit<Schedule, 'id' | 'created_at' | 'updated_at'> = {
        title: title.trim(),
        context: context.trim(),
        start_date: startDateTime,
        end_date: endDateTime,
        all_day: false,
        event_type: 'appointment',
        location: location.trim() || 'Office',
        blocks_work_time: true,
        tags: ['therapy', 'counseling'],
      };

      // Find the "Therapy Notes" project to assign the progress note to
      const therapyNotesProject = projects.find(p => 
        p.title.toLowerCase().includes('therapy') && p.title.toLowerCase().includes('notes')
      );
      
      if (therapyNotesProject) {
        console.log(`📋 Assigning progress note to project: ${therapyNotesProject.title}`);
      } else {
        console.log('⚠️ Therapy Notes project not found. Progress note will not be assigned to a project.');
        console.log('Available projects:', projects.map(p => p.title));
      }

      const progressNoteTask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
        title: `Progress Note - ${date}`,
        context: `Write therapy progress note for counseling session conducted on ${date}. Include client progress, session goals, interventions used, and next steps.`,
        priority: TaskPriority.MEDIUM,
        estimated_hours: 0.5,
        status: TaskStatus.TODO,
        due_date: date,
        project_id: therapyNotesProject?.id, // Assign to Therapy Notes project if found
        tags: ['progress-note', 'therapy', 'documentation'],
        dependencies: [],
        energy_level: 'low',
      };

      await onAddCounselingSession(counselingSession, progressNoteTask);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error creating counseling session:', error);
      setErrorMessage(error.message || 'Failed to create counseling session. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="counselingModalTitle"
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="counselingModalTitle" className="text-2xl font-semibold text-blue-400">Schedule Counseling Session</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-200" aria-label="Close modal">
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
            <label htmlFor="sessionTitle" className="block text-sm font-medium text-slate-300 mb-1">
              Session Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="sessionTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="sessionContext" className="block text-sm font-medium text-slate-300 mb-1">
              Session Type/Notes
              <span className="block text-xs text-slate-400 font-normal mt-0.5">
                Details about this counseling session (e.g., individual therapy, couple's session, etc.)
              </span>
            </label>
            <textarea
              id="sessionContext"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
              placeholder="Individual therapy session, follow-up meeting, initial consultation..."
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="sessionLocation" className="block text-sm font-medium text-slate-300 mb-1">Location</label>
            <input
              type="text"
              id="sessionLocation"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Office, Room 123, Telehealth, etc."
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="sessionDate" className="block text-sm font-medium text-slate-300 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="sessionDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-slate-300 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-slate-300 mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-400">Automatic Progress Note</h4>
                <p className="text-xs text-blue-300 mt-1">
                  A progress note task will automatically be created for this session to help with documentation requirements.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="h-5 w-5" /> : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CounselingSessionModal;