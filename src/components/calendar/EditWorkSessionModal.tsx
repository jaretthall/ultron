import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../../services/calendarIntegrationService';
import { Task } from '../../../types';

interface EditWorkSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEvent: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  event: CalendarEvent | null;
  task?: Task;
}

const EditWorkSessionModal: React.FC<EditWorkSessionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  task
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState<number>(1); // Duration in hours
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when modal opens or event changes
  useEffect(() => {
    if (event && isOpen) {
      const start = event.start;
      const end = event.end;
      
      // Set title (remove emoji prefix if present)
      const cleanTitle = event.title.replace(/^[🔨🤖🔴]\s*/, '');
      setTitle(cleanTitle);
      
      // Set date and time
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5)); // HH:MM format
      
      // Calculate duration in hours
      const durationMs = end.getTime() - start.getTime();
      const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 4) / 4; // Round to nearest 15 minutes
      setDuration(durationHours);
    }
  }, [event, isOpen]);

  const handleSave = async () => {
    if (!event || !startDate || !startTime) return;
    
    try {
      setIsSubmitting(true);
      
      // Create new start time
      const newStart = new Date(`${startDate}T${startTime}:00`);
      
      // Calculate new end time based on duration
      const newEnd = new Date(newStart.getTime() + (duration * 60 * 60 * 1000));
      
      // Create updated event
      const updatedEvent: CalendarEvent = {
        ...event,
        title: `${getEventIcon(event)} ${title}`,
        start: newStart,
        end: newEnd
      };
      
      await onSave(updatedEvent);
      onClose();
    } catch (error) {
      console.error('Error saving work session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this work session?');
    if (confirmed) {
      try {
        setIsSubmitting(true);
        await onDelete(event.id);
        onClose();
      } catch (error) {
        console.error('Error deleting work session:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Get the appropriate icon for the event
  const getEventIcon = (event: CalendarEvent) => {
    if (event.metadata?.timeBlocked) return '🔴';
    if (event.source === 'ai_generated') return '🤖';
    return '🔨';
  };

  // Duration options (in hours)
  const durationOptions = [
    { value: 0.25, label: '15 minutes' },
    { value: 0.5, label: '30 minutes' },
    { value: 0.75, label: '45 minutes' },
    { value: 1, label: '1 hour' },
    { value: 1.5, label: '1.5 hours' },
    { value: 2, label: '2 hours' },
    { value: 2.5, label: '2.5 hours' },
    { value: 3, label: '3 hours' },
    { value: 4, label: '4 hours' },
    { value: 6, label: '6 hours' },
    { value: 8, label: '8 hours' }
  ];

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Edit Work Session
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Task Information */}
            {task && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Task: {task.title}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Priority: {task.priority} • Estimated: {task.estimated_hours}h
                  {task.progress ? ` • Progress: ${task.progress}%` : ''}
                </p>
                {task.due_date && (
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Event Type Badge */}
            <div className="flex gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                event.source === 'ai_generated' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : event.metadata?.timeBlocked
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {getEventIcon(event)} {
                  event.source === 'ai_generated' ? 'AI Suggested' :
                  event.metadata?.timeBlocked ? 'Time Blocked' : 'Manual Work Session'
                }
              </span>
            </div>

            <div>
              <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                id="editTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="editDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                id="editDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="editTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                id="editTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="editDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration
              </label>
              <select
                id="editDuration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                disabled={isSubmitting}
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {startDate && startTime && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Updated Schedule:</strong><br />
                  {new Date(`${startDate}T${startTime}:00`).toLocaleDateString()} at {new Date(`${startDate}T${startTime}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  <br />
                  <span className="text-xs">
                    Duration: {duration >= 1 ? `${duration} hour${duration > 1 ? 's' : ''}` : `${duration * 60} minutes`}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <div>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!startDate || !startTime || !title.trim() || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditWorkSessionModal;