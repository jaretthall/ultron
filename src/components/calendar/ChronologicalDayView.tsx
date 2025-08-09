import React, { useMemo } from 'react';
import { CalendarEvent, AIScheduleSuggestion } from '../../services/calendarIntegrationService';

interface ChronologicalDayViewProps {
  selectedDate: Date | null;
  events: CalendarEvent[];
  suggestions: AIScheduleSuggestion[];
  onEventClick: (event: CalendarEvent) => void;
  onSuggestionApprove: (suggestion: AIScheduleSuggestion) => void;
  onSuggestionDeny: (suggestionId: string) => void;
  onClose: () => void;
}

interface TimeSlotEvents {
  hour: number;
  timeLabel: string;
  events: CalendarEvent[];
  suggestions: AIScheduleSuggestion[];
}

const ChronologicalDayView: React.FC<ChronologicalDayViewProps> = ({
  selectedDate,
  events,
  suggestions,
  onEventClick,
  onSuggestionApprove,
  onSuggestionDeny,
  onClose
}) => {
  // Generate time slots and organize events/suggestions by hour
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const selectedDateKey = selectedDate.toISOString().split('T')[0];
    
    // Filter events for the selected date
    const dayEvents = events.filter(event => {
      const eventDateKey = event.start.toISOString().split('T')[0];
      return eventDateKey === selectedDateKey;
    });

    // Filter suggestions for the selected date
    const daySuggestions = suggestions.filter(suggestion => {
      const suggestionDateKey = suggestion.suggestedStart.toISOString().split('T')[0];
      return suggestionDateKey === selectedDateKey && suggestion.status === 'pending';
    });

    // Create time slots from 6 AM to 11 PM
    const slots: TimeSlotEvents[] = [];
    for (let hour = 6; hour <= 23; hour++) {
      const timeLabel = hour === 12 ? '12:00 PM' : 
                       hour > 12 ? `${hour - 12}:00 PM` : 
                       hour === 0 ? '12:00 AM' :
                       `${hour}:00 AM`;

      // Find events that start in this hour
      const hourEvents = dayEvents.filter(event => {
        const eventHour = event.start.getHours();
        return eventHour === hour;
      });

      // Find suggestions that start in this hour
      const hourSuggestions = daySuggestions.filter(suggestion => {
        const suggestionHour = suggestion.suggestedStart.getHours();
        return suggestionHour === hour;
      });

      // Only include time slots that have events or suggestions, or are important times
      if (hourEvents.length > 0 || hourSuggestions.length > 0 || 
          hour === 8 || hour === 12 || hour === 17) { // Show 8 AM, noon, 5 PM as anchor points
        slots.push({
          hour,
          timeLabel,
          events: hourEvents.sort((a, b) => a.start.getTime() - b.start.getTime()),
          suggestions: hourSuggestions.sort((a, b) => a.suggestedStart.getTime() - b.suggestedStart.getTime())
        });
      }
    }

    return slots;
  }, [selectedDate, events, suggestions]);

  // Get event color for consistent styling
  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'deadline':
        return 'bg-red-500 border-red-600 text-white';
      case 'work_session':
        if (event.metadata?.timeBlocked) {
          return 'bg-red-500 border-red-600 text-white';
        }
        if (event.source === 'ai_generated') {
          return 'bg-purple-500 border-purple-600 text-white';
        }
        return 'bg-blue-500 border-blue-600 text-white';
      case 'counseling_session':
        return 'bg-teal-500 border-teal-600 text-white';
      case 'wellness_break':
        return 'bg-blue-500 border-blue-600 text-white';
      case 'health_break':
      case 'meal_break':
        return 'bg-orange-500 border-orange-600 text-white';
      case 'event':
        if (event.title.toLowerCase().includes('counseling')) {
          return 'bg-teal-500 border-teal-600 text-white';
        }
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
        if (event.metadata?.timeBlocked) {
          return '🔴';
        }
        return event.source === 'ai_generated' ? '🤖' : '🔨';
      case 'counseling_session':
        return '💬';
      case 'wellness_break':
        if (event.title.includes('Lunch')) return '🍽️';
        if (event.title.includes('Walk')) return '🚶';
        if (event.title.includes('Meditation')) return '🧘';
        return '✨';
      case 'health_break':
      case 'meal_break':
        return '🍽️';
      case 'event':
        return '📅';
      default:
        return '•';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!selectedDate) {
    return (
      <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Day Schedule
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>
        <p className="text-gray-500 dark:text-gray-400">Select a date to view its schedule</p>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col max-h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Day Schedule
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Chronological Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {timeSlots.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">📅</div>
            <p className="text-gray-500 dark:text-gray-400">No events scheduled for this day</p>
          </div>
        ) : (
          timeSlots.map((slot) => (
            <div key={slot.hour} className="relative">
              {/* Time Label */}
              <div className="flex items-center mb-3">
                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {slot.timeLabel}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600 ml-4"></div>
              </div>

              {/* Events and Suggestions */}
              <div className="ml-4 space-y-2">
                {/* Events */}
                {slot.events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${getEventColor(event)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">{getEventIcon(event)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-tight">
                          {event.title}
                        </div>
                        <div className="text-xs opacity-90 mt-1">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        {event.metadata?.estimatedHours && (
                          <div className="text-xs opacity-75 mt-1">
                            Est. {event.metadata.estimatedHours}h
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* AI Suggestions */}
                {slot.suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-3 rounded-lg border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">🤖</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-purple-800 dark:text-purple-200 leading-tight">
                          {suggestion.taskTitle}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                          {formatTime(suggestion.suggestedStart)} - {formatTime(suggestion.suggestedEnd)}
                        </div>
                        <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                          AI Suggestion • {Math.round(suggestion.confidence * 100)}% confidence
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSuggestionApprove(suggestion);
                            }}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSuggestionDeny(suggestion.id);
                            }}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty time slot indicator */}
                {slot.events.length === 0 && slot.suggestions.length === 0 && (
                  <div className="text-gray-400 dark:text-gray-500 text-sm italic ml-4">
                    Free time
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChronologicalDayView;