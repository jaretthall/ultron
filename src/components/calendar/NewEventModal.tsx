import React, { useState } from 'react';
import { CalendarEvent, Project } from '../../../types';
import LoadingSpinner from '../LoadingSpinner';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => void;
  projects: Project[];
  defaultDate?: string;
}

const NewEventModal: React.FC<NewEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
  projects,
  defaultDate
}) => {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [startDate, setStartDate] = useState(defaultDate || '');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState(defaultDate || '');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState<'meeting' | 'appointment' | 'deadline' | 'personal' | 'other'>('meeting');
  const [location, setLocation] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [blocksWorkTime, setBlocksWorkTime] = useState(true);
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Recurring event fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [recurrenceEndType, setRecurrenceEndType] = useState<'date' | 'count'>('count');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceCount, setRecurrenceCount] = useState(4);

  // Helper function to generate recurring dates
  const generateRecurringDates = (startDate: Date, pattern: string, endType: string, endDate?: Date, count?: number): Date[] => {
    const dates: Date[] = [new Date(startDate)];
    const maxOccurrences = endType === 'count' ? (count || 4) : 100; // Safety limit
    const endDateTime = endDate ? new Date(endDate) : null;
    
    let currentDate = new Date(startDate);
    let occurrences = 1;
    
    while (occurrences < maxOccurrences) {
      switch (pattern) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
      
      // Check if we've reached the end date
      if (endDateTime && currentDate > endDateTime) {
        break;
      }
      
      dates.push(new Date(currentDate));
      occurrences++;
    }
    
    return dates;
  };

  const resetForm = () => {
    setTitle('');
    setContext('');
    setStartDate(defaultDate || '');
    setStartTime('');
    setEndDate(defaultDate || '');
    setEndTime('');
    setAllDay(false);
    setEventType('meeting');
    setLocation('');
    setProjectId('');
    setBlocksWorkTime(true);
    setTags('');
    setErrorMessage('');
    setIsRecurring(false);
    setRecurrencePattern('weekly');
    setRecurrenceEndType('count');
    setRecurrenceEndDate('');
    setRecurrenceCount(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        startDateTime = `${startDate}T${startTime}`;
        endDateTime = endDate && endTime ? `${endDate}T${endTime}` : 
                     endTime ? `${startDate}T${endTime}` :
                     `${startDate}T${startTime}`;
      }

      const baseEventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'> = {
        title: title.trim(),
        context: context.trim() || undefined,
        start_date: startDateTime,
        end_date: endDateTime,
        all_day: allDay,
        event_type: eventType,
        location: location.trim() || undefined,
        task_id: undefined, // Events are not directly linked to tasks in this form
        blocks_work_time: blocksWorkTime,
        tags: [
          ...tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          ...(projectId ? [`project:${projectId}`] : [])
        ],
      };

      if (isRecurring) {
        // Generate recurring dates
        const startDateObj = new Date(startDate);
        const endDateObj = recurrenceEndType === 'date' && recurrenceEndDate ? new Date(recurrenceEndDate) : undefined;
        const recurringDates = generateRecurringDates(
          startDateObj, 
          recurrencePattern, 
          recurrenceEndType, 
          endDateObj, 
          recurrenceCount
        );

        // Create events for each recurring date
        for (let i = 0; i < recurringDates.length; i++) {
          const currentDate = recurringDates[i];
          const currentStartDate = currentDate.toISOString().split('T')[0];
          
          let currentStartDateTime: string;
          let currentEndDateTime: string;
          
          if (allDay) {
            currentStartDateTime = currentStartDate;
            currentEndDateTime = currentStartDate;
          } else {
            currentStartDateTime = `${currentStartDate}T${startTime}`;
            currentEndDateTime = endTime ? `${currentStartDate}T${endTime}` : `${currentStartDate}T${startTime}`;
          }

          const recurringEventData = {
            ...baseEventData,
            title: `${title.trim()}${recurringDates.length > 1 ? ` (${i + 1}/${recurringDates.length})` : ''}`,
            start_date: currentStartDateTime,
            end_date: currentEndDateTime,
            tags: [...baseEventData.tags, 'recurring']
          };

          await onAddEvent(recurringEventData);
        }
      } else {
        // Single event
        await onAddEvent(baseEventData);
      }

      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error creating event:', error);
      setErrorMessage(error.message || 'Failed to create event. Please try again.');
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
      aria-labelledby="newEventModalTitle"
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="newEventModalTitle" className="text-2xl font-semibold text-sky-400">Create Calendar Event</h2>
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
              <span className="block text-xs text-slate-400 font-normal mt-0.5">
                Provide details about this event to help AI understand when you'll be unavailable.
              </span>
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

          {/* Recurring Event Options */}
          <div className="border-t border-slate-600 pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500"
                disabled={isSubmitting}
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-slate-300">
                🔄 Make this a recurring event
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-4 pl-6 border-l-2 border-sky-600 bg-sky-900/10 p-4 rounded-lg">
                <div>
                  <label htmlFor="recurrencePattern" className="block text-sm font-medium text-slate-300 mb-2">
                    Repeat every:
                  </label>
                  <select
                    id="recurrencePattern"
                    value={recurrencePattern}
                    onChange={(e) => setRecurrencePattern(e.target.value as any)}
                    className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                    disabled={isSubmitting}
                  >
                    <option value="daily">Day</option>
                    <option value="weekly">Week</option>
                    <option value="biweekly">2 Weeks</option>
                    <option value="monthly">Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    End recurrence:
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="endByCount"
                        name="recurrenceEnd"
                        checked={recurrenceEndType === 'count'}
                        onChange={() => setRecurrenceEndType('count')}
                        className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 focus:ring-sky-500"
                        disabled={isSubmitting}
                      />
                      <label htmlFor="endByCount" className="text-sm text-slate-300">After</label>
                      <input
                        type="number"
                        value={recurrenceCount}
                        onChange={(e) => setRecurrenceCount(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max="52"
                        className="w-20 bg-slate-700 border-slate-600 text-slate-100 rounded-md p-1 text-sm focus:ring-sky-500 focus:border-sky-500"
                        disabled={isSubmitting || recurrenceEndType !== 'count'}
                      />
                      <span className="text-sm text-slate-300">occurrences</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="endByDate"
                        name="recurrenceEnd"
                        checked={recurrenceEndType === 'date'}
                        onChange={() => setRecurrenceEndType('date')}
                        className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 focus:ring-sky-500"
                        disabled={isSubmitting}
                      />
                      <label htmlFor="endByDate" className="text-sm text-slate-300">On</label>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100 rounded-md p-1 text-sm focus:ring-sky-500 focus:border-sky-500"
                        disabled={isSubmitting || recurrenceEndType !== 'date'}
                        min={startDate}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="text-xs text-slate-400 bg-slate-800 p-2 rounded">
                  <strong>Preview:</strong> {recurrencePattern === 'daily' ? 'Daily' : 
                    recurrencePattern === 'weekly' ? 'Every Wednesday' :
                    recurrencePattern === 'biweekly' ? 'Every other Wednesday' :
                    'Monthly on the 2nd Wednesday'} 
                  {recurrenceEndType === 'count' ? ` for ${recurrenceCount} occurrences` : 
                   recurrenceEndDate ? ` until ${new Date(recurrenceEndDate).toLocaleDateString()}` : ''}
                </div>
              </div>
            )}
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
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-sky-800 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="h-5 w-5" /> : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEventModal; 