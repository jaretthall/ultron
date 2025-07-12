import React, { useMemo } from 'react';
import { Task } from '../../../types';
import { CalendarEvent, AIScheduleSuggestion } from '../../services/calendarIntegrationService';

interface DayDetailsSidebarProps {
  selectedDate: Date | null;
  events: CalendarEvent[];
  suggestions: AIScheduleSuggestion[];
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick?: (task: Task) => void;
  onSuggestionApprove: (suggestion: AIScheduleSuggestion) => void;
  onSuggestionDeny: (suggestionId: string) => void;
  onClose: () => void;
}

const DayDetailsSidebar: React.FC<DayDetailsSidebarProps> = ({
  selectedDate,
  events,
  suggestions,
  onEventClick,
  onTaskClick: _onTaskClick, // Prefix with underscore to indicate intentionally unused
  onSuggestionApprove,
  onSuggestionDeny,
  onClose
}) => {
  // Filter events for the selected date
  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => 
      event.start >= dayStart && event.start <= dayEnd
    ).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [selectedDate, events]);

  // Filter suggestions for the selected date
  const daySuggestions = useMemo(() => {
    if (!selectedDate) return [];
    
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    return suggestions.filter(suggestion => 
      suggestion.suggestedStart >= dayStart && suggestion.suggestedStart <= dayEnd
    ).sort((a, b) => a.suggestedStart.getTime() - b.suggestedStart.getTime());
  }, [selectedDate, suggestions]);

  // Group events by type
  const groupedEvents = useMemo(() => {
    const deadlines = dayEvents.filter(e => e.type === 'deadline');
    const workSessions = dayEvents.filter(e => e.type === 'work_session');
    const meetings = dayEvents.filter(e => e.type === 'event' || e.type === 'counseling_session');
    
    return { deadlines, workSessions, meetings };
  }, [dayEvents]);

  // Get event color
  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'deadline':
        return 'bg-red-500 border-red-600 text-white';
      case 'work_session':
        return event.source === 'ai_generated' ? 'bg-purple-500 border-purple-600 text-white' : 'bg-blue-500 border-blue-600 text-white';
      case 'counseling_session':
        return 'bg-teal-500 border-teal-600 text-white';
      case 'event':
        return 'bg-green-500 border-green-600 text-white';
      default:
        return 'bg-gray-500 border-gray-600 text-white';
    }
  };

  // Get event icon
  const getEventIcon = (event: CalendarEvent) => {
    switch (event.type) {
      case 'deadline':
        return '⏰';
      case 'work_session':
        return event.source === 'ai_generated' ? '🤖' : '🔨';
      case 'counseling_session':
        return '💬';
      case 'event':
        return '📅';
      default:
        return '•';
    }
  };

  // Calculate progress for the day
  const dayProgress = useMemo(() => {
    const completedEvents = dayEvents.filter(e => e.metadata?.progress === 100).length;
    const totalEvents = dayEvents.length;
    return totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;
  }, [dayEvents]);

  // Calculate total time scheduled
  const totalScheduledTime = useMemo(() => {
    return dayEvents
      .filter(e => e.type === 'work_session')
      .reduce((total, event) => {
        const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
        return total + duration;
      }, 0);
  }, [dayEvents]);

  if (!selectedDate) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400 p-6">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-lg font-medium">Select a date</p>
          <p className="text-sm">Click on any date to see details</p>
        </div>
      </div>
    );
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Day Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="font-medium">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          {isToday && <div className="text-blue-600 dark:text-blue-400 font-medium">Today</div>}
        </div>

        {/* Day Summary */}
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
            <div className="text-blue-600 dark:text-blue-400 font-semibold">{dayEvents.length}</div>
            <div className="text-blue-600 dark:text-blue-400 text-xs">Events</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
            <div className="text-green-600 dark:text-green-400 font-semibold">{totalScheduledTime.toFixed(1)}h</div>
            <div className="text-green-600 dark:text-green-400 text-xs">Scheduled</div>
          </div>
        </div>

        {/* Progress Bar */}
        {dayEvents.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(dayProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${dayProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Suggestions */}
        {daySuggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span>✨</span>
              AI Suggestions ({daySuggestions.length})
            </h3>
            <div className="space-y-2">
              {daySuggestions.map(suggestion => (
                <div key={suggestion.id} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                      {suggestion.taskTitle}
                    </h4>
                    <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-1 rounded">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                    {suggestion.suggestedStart.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })} - {suggestion.suggestedEnd.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </div>
                  
                  <p className="text-xs text-purple-600 dark:text-purple-300 mb-3">
                    {suggestion.reasoning}
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSuggestionApprove(suggestion)}
                      className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onSuggestionDeny(suggestion.id)}
                      className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Sessions */}
        {groupedEvents.workSessions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span>🔨</span>
              Work Sessions ({groupedEvents.workSessions.length})
            </h3>
            <div className="space-y-2">
              {groupedEvents.workSessions.map(event => (
                <div 
                  key={event.id}
                  className={`rounded-lg p-3 cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(event)}`}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{getEventIcon(event)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs opacity-90">
                        {event.start.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })} - {event.end.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                      {event.metadata?.estimatedHours && (
                        <div className="text-xs opacity-75 mt-1">
                          Estimated: {event.metadata.estimatedHours}h
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deadlines */}
        {groupedEvents.deadlines.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span>⏰</span>
              Deadlines ({groupedEvents.deadlines.length})
            </h3>
            <div className="space-y-2">
              {groupedEvents.deadlines.map(event => (
                <div 
                  key={event.id}
                  className={`rounded-lg p-3 cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(event)}`}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{getEventIcon(event)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      {event.priority && (
                        <div className="text-xs opacity-90">
                          Priority: {event.priority}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meetings & Events */}
        {groupedEvents.meetings.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span>📅</span>
              Meetings & Events ({groupedEvents.meetings.length})
            </h3>
            <div className="space-y-2">
              {groupedEvents.meetings.map(event => (
                <div 
                  key={event.id}
                  className={`rounded-lg p-3 cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(event)}`}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{getEventIcon(event)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs opacity-90">
                        {event.start.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })} - {event.end.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {dayEvents.length === 0 && daySuggestions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-sm font-medium">No events scheduled</p>
            <p className="text-xs">This day is completely free</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayDetailsSidebar;