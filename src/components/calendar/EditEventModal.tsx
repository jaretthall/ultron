import React, { useState, useEffect } from 'react';
import { Schedule, Project } from '../../../types';
import LoadingSpinner from '../LoadingSpinner';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateEvent: (id: string, updates: Partial<Schedule>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  event: Schedule | null;
  projects: Project[];
}

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  onUpdateEvent,
  onDeleteEvent,
  event,
  projects
}) => {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState<'meeting' | 'appointment' | 'deadline' | 'personal' | 'other'>('meeting');
  const [location, setLocation] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [blocksWorkTime, setBlocksWorkTime] = useState(true);
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setContext(event.context || '');
      
      // Parse dates and times
      const startDateTime = new Date(event.start_date);
      const endDateTime = new Date(event.end_date);
      
      if (event.all_day) {
        setStartDate(event.start_date.split('T')[0]);
        setEndDate(event.end_date.split('T')[0]);
        setStartTime('');
        setEndTime('');
      } else {
        setStartDate(startDateTime.toISOString().split('T')[0]);
        setEndDate(endDateTime.toISOString().split('T')[0]);
        setStartTime(startDateTime.toTimeString().slice(0, 5));
        setEndTime(endDateTime.toTimeString().slice(0, 5));
      }
      
      setAllDay(event.all_day || false);
      setEventType(event.event_type || 'other');
      setLocation(event.location || '');
      setProjectId(event.task_id || ''); // Using task_id since schedules link to tasks, not projects
      setBlocksWorkTime(event.blocks_work_time || false);
      setTags(Array.isArray(event.tags) ? event.tags.join(', ') : '');
    }
  }, [event]);

  const resetForm = () => {
    setTitle('');
    setContext('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setAllDay(false);
    setEventType('meeting');
    setLocation('');
    setProjectId('');
    setBlocksWorkTime(true);
    setTags('');
    setErrorMessage('');
    setShowDeleteConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) {
      console.error('❌ No event provided to handleSubmit');
      return;
    }
    
    if (!title.trim()) {
      setErrorMessage('Event title is required.');
      return;
    }

    if (!startDate) {
      setErrorMessage('Start date is required.');
      return;
    }

    if (!allDay && !startTime) {
      setErrorMessage('Start time is required for non-all-day events.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let startDateTime: string;
      let endDateTime: string;

      if (allDay) {
        startDateTime = startDate;
        endDateTime = endDate || startDate;
      } else {
        // Create proper Date objects in local time, then convert to ISO strings
        const localStartDateTime = new Date(`${startDate}T${startTime}:00`);
        startDateTime = localStartDateTime.toISOString();
        
        if (endDate && endTime) {
          const localEndDateTime = new Date(`${endDate}T${endTime}:00`);
          endDateTime = localEndDateTime.toISOString();
        } else if (endTime) {
          const localEndDateTime = new Date(`${startDate}T${endTime}:00`);
          endDateTime = localEndDateTime.toISOString();
        } else {
          // Default to 1 hour duration
          const localEndDateTime = new Date(localStartDateTime);
          localEndDateTime.setHours(localEndDateTime.getHours() + 1);
          endDateTime = localEndDateTime.toISOString();
        }
      }

      const updates: Partial<Schedule> = {
        title: title.trim(),
        context: context.trim() || undefined,
        start_date: startDateTime,
        end_date: endDateTime,
        all_day: allDay,
        event_type: eventType,
        location: location.trim() || undefined,
        task_id: projectId || undefined, // Using task_id field
        blocks_work_time: blocksWorkTime,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      await onUpdateEvent(event.id, updates);
      
      // Show success notification
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000); // Increased from 1000ms to 2000ms for better visibility
    } catch (error: any) {
      console.error('❌ Error updating event:', error);
      setErrorMessage(error.message || 'Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    setIsDeleting(true);
    setErrorMessage('');

    try {
      await onDeleteEvent(event.id);
      onClose();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setErrorMessage(error.message || 'Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || isDeleting) return;
    resetForm();
    onClose();
  };

  if (!isOpen || !event) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="editEventModalTitle"
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="editEventModalTitle" className="text-2xl font-semibold text-sky-400">Edit Event</h2>
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

        {showSuccess && (
          <div className="mb-4 p-3 bg-green-800/20 border border-green-600 rounded-lg">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Event updated successfully!
            </p>
          </div>
        )}

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="eventTitle" className="block text-sm font-medium text-slate-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="eventTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="eventContext" className="block text-sm font-medium text-slate-300 mb-1">
                Context
              </label>
              <textarea
                id="eventContext"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                placeholder="Describe the purpose, attendees, or any other context about this event..."
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-slate-300 mb-1">Event Type</label>
                <select
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                  disabled={isSubmitting}
                >
                  <option value="meeting">Meeting</option>
                  <option value="appointment">Appointment</option>
                  <option value="deadline">Deadline</option>
                  <option value="personal">Personal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="eventProject" className="block text-sm font-medium text-slate-300 mb-1">Project (Optional)</label>
                <select
                  id="eventProject"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                  disabled={isSubmitting}
                >
                  <option value="">No Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="eventLocation" className="block text-sm font-medium text-slate-300 mb-1">Location</label>
              <input
                type="text"
                id="eventLocation"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Conference Room A, Zoom, Client Office"
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-slate-700/50 rounded-lg">
              <input
                type="checkbox"
                id="allDay"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500"
                disabled={isSubmitting}
              />
              <label htmlFor="allDay" className="text-sm text-slate-300">All-day event</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              {!allDay && (
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-slate-300 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                    required={!allDay}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                  disabled={isSubmitting}
                />
              </div>
              {!allDay && (
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 p-3 bg-slate-700/50 rounded-lg">
              <input
                type="checkbox"
                id="blocksWorkTime"
                checked={blocksWorkTime}
                onChange={(e) => setBlocksWorkTime(e.target.checked)}
                className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500"
                disabled={isSubmitting}
              />
              <label htmlFor="blocksWorkTime" className="text-sm text-slate-300">
                Blocks work time
                <span className="block text-xs text-slate-400 font-normal">
                  AI won't schedule tasks during this time
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="eventTags" className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                id="eventTags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., important, recurring, client"
                className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Delete Event
              </button>
              <div className="flex space-x-3">
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
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-sky-800 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <LoadingSpinner size="h-5 w-5" /> : 'Update Event'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-100 mb-2">Delete Event</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete "{event.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:bg-red-800 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                disabled={isDeleting}
              >
                {isDeleting ? <LoadingSpinner size="h-5 w-5" /> : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditEventModal;