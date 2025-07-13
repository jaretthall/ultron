import React, { useState, useEffect } from 'react';
import { AIScheduleSuggestion } from '../../services/calendarIntegrationService';

interface ModifyTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (suggestion: AIScheduleSuggestion, newStart: Date, newEnd: Date) => void;
  suggestion: AIScheduleSuggestion | null;
}

const ModifyTimeModal: React.FC<ModifyTimeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  suggestion
}) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState<number>(1); // Duration in hours
  
  // Initialize form when modal opens or suggestion changes
  useEffect(() => {
    if (suggestion && isOpen) {
      const start = suggestion.suggestedStart;
      const end = suggestion.suggestedEnd;
      
      // Set date and time
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5)); // HH:MM format
      
      // Calculate duration in hours
      const durationMs = end.getTime() - start.getTime();
      const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 4) / 4; // Round to nearest 15 minutes
      setDuration(durationHours);
    }
  }, [suggestion, isOpen]);

  const handleSave = () => {
    if (!suggestion || !startDate || !startTime) return;
    
    // Create new start time
    const newStart = new Date(`${startDate}T${startTime}:00`);
    
    // Calculate new end time based on duration
    const newEnd = new Date(newStart.getTime() + (duration * 60 * 60 * 1000));
    
    onSave(suggestion, newStart, newEnd);
    onClose();
  };

  const handleClose = () => {
    onClose();
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

  if (!isOpen || !suggestion) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Modify Time
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task: {suggestion.taskTitle}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Current: {suggestion.suggestedStart.toLocaleDateString()} at {suggestion.suggestedStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="modifyDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                id="modifyDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="modifyTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                id="modifyTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="modifyDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration
              </label>
              <select
                id="modifyDuration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {startDate && startTime && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>New Schedule:</strong><br />
                  {new Date(`${startDate}T${startTime}:00`).toLocaleDateString()} at {new Date(`${startDate}T${startTime}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  <br />
                  <span className="text-xs">
                    Duration: {duration >= 1 ? `${duration} hour${duration > 1 ? 's' : ''}` : `${duration * 60} minutes`}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!startDate || !startTime}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifyTimeModal;