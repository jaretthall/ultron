import React, { useState, useMemo, useCallback } from 'react';
import { CalendarEvent, AIScheduleSuggestion } from '../../services/calendarIntegrationService';

interface TimeBlock {
  id: string;
  start: Date;
  end: Date;
  title: string;
  type: 'event' | 'suggestion' | 'deadline' | 'wellness' | 'counseling' | 'work_session';
  source: 'manual' | 'ai_generated' | 'schedule' | 'task';
  isPenciledIn?: boolean;
  isEditable: boolean;
  color: string;
  icon: string;
  originalData?: CalendarEvent | AIScheduleSuggestion;
}

interface EnhancedDayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  suggestions: AIScheduleSuggestion[];
  onEventClick: (event: CalendarEvent) => void;
  onSuggestionApprove: (suggestion: AIScheduleSuggestion) => void;
  onSuggestionDeny: (suggestionId: string) => void;
  onSuggestionPencilIn: (suggestionId: string, isPenciledIn: boolean) => void;
  onTimeBlockMove?: (blockId: string, newStart: Date, newEnd: Date) => void;
}

const EnhancedDayView: React.FC<EnhancedDayViewProps> = ({
  selectedDate,
  events,
  suggestions,
  onEventClick,
  onSuggestionApprove,
  onSuggestionDeny,
  onSuggestionPencilIn
  // onTimeBlockMove - will implement drag & drop later
}) => {
  const [penciledSuggestions, setPenciledSuggestions] = useState<Set<string>>(new Set());
  // Drag state - will implement later for drag & drop functionality
  // const [dragState, setDragState] = useState<{
  //   isDragging: boolean;
  //   blockId: string | null;
  //   startY: number;
  //   originalStart: Date | null;
  // }>({
  //   isDragging: false,
  //   blockId: null,
  //   startY: 0,
  //   originalStart: null
  // });

  // Convert events and suggestions to unified time blocks
  const timeBlocks = useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    // Filter events for selected date
    const dayEvents = events.filter(event => {
      const eventDateStr = event.start.toISOString().split('T')[0];
      return eventDateStr === selectedDateStr;
    });

    // Filter suggestions for selected date
    const daySuggestions = suggestions.filter(suggestion => {
      const suggestionDateStr = suggestion.suggestedStart.toISOString().split('T')[0];
      return suggestionDateStr === selectedDateStr && suggestion.status === 'pending';
    });

    const blocks: TimeBlock[] = [];

    // Convert events to time blocks
    dayEvents.forEach(event => {
      blocks.push({
        id: `event-${event.id}`,
        start: event.start,
        end: event.end,
        title: event.title,
        type: event.type as TimeBlock['type'],
        source: event.source,
        isEditable: event.editable,
        color: getEventColor(event),
        icon: getEventIcon(event),
        originalData: event
      });
    });

    // Convert suggestions to time blocks
    daySuggestions.forEach(suggestion => {
      blocks.push({
        id: `suggestion-${suggestion.id}`,
        start: suggestion.suggestedStart,
        end: suggestion.suggestedEnd,
        title: suggestion.taskTitle,
        type: 'suggestion',
        source: 'ai_generated',
        isPenciledIn: penciledSuggestions.has(suggestion.id),
        isEditable: true,
        color: penciledSuggestions.has(suggestion.id) ? 'bg-blue-100 border-blue-500' : 'bg-purple-100 border-purple-500',
        icon: penciledSuggestions.has(suggestion.id) ? '📌' : '🤖',
        originalData: suggestion
      });
    });

    return blocks.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [selectedDate, events, suggestions, penciledSuggestions]);

  // Generate hour slots from 6 AM to 11 PM
  const hourSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      const timeLabel = hour === 12 ? '12:00 PM' : 
                       hour > 12 ? `${hour - 12}:00 PM` : 
                       hour === 0 ? '12:00 AM' :
                       `${hour}:00 AM`;
      
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Find blocks that start in this hour
      const hourBlocks = timeBlocks.filter(block => 
        block.start.getHours() === hour
      );

      slots.push({
        hour,
        timeLabel,
        start: slotStart,
        end: slotEnd,
        blocks: hourBlocks
      });
    }
    return slots;
  }, [selectedDate, timeBlocks]);

  const handlePencilToggle = useCallback((suggestionId: string) => {
    const isPenciledIn = penciledSuggestions.has(suggestionId);
    const newPenciledState = new Set(penciledSuggestions);
    
    if (isPenciledIn) {
      newPenciledState.delete(suggestionId);
    } else {
      newPenciledState.add(suggestionId);
    }
    
    setPenciledSuggestions(newPenciledState);
    onSuggestionPencilIn(suggestionId, !isPenciledIn);
  }, [penciledSuggestions, onSuggestionPencilIn]);

  const handleBlockClick = useCallback((block: TimeBlock) => {
    if (block.type === 'suggestion' && block.originalData) {
      // For suggestions, show approve/deny options
      return;
    } else if (block.originalData) {
      onEventClick(block.originalData as CalendarEvent);
    }
  }, [onEventClick]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="enhanced-day-view bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Day Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Day Schedule - {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              AI Suggestions
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              Penciled In
            </span>
          </div>
        </div>
      </div>

      {/* Time Grid */}
      <div className="time-grid">
        {hourSlots.map(slot => (
          <div key={slot.hour} className="hour-slot flex border-b border-gray-100 dark:border-gray-700">
            {/* Time Label */}
            <div className="w-20 flex-shrink-0 p-3 text-sm text-gray-600 dark:text-gray-400 font-medium border-r border-gray-200 dark:border-gray-600">
              {slot.timeLabel}
            </div>

            {/* Time Block Area */}
            <div className="flex-1 p-2 min-h-[60px] relative">
              {slot.blocks.length === 0 ? (
                <div className="h-full flex items-center text-gray-400 dark:text-gray-500 text-sm italic">
                  Free time
                </div>
              ) : (
                <div className="space-y-1">
                  {slot.blocks.map(block => (
                    <div
                      key={block.id}
                      className={`time-block p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md ${block.color}`}
                      onClick={() => handleBlockClick(block)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-lg flex-shrink-0">{block.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm leading-tight truncate">
                              {block.title}
                            </div>
                            <div className="text-xs opacity-75 mt-1">
                              {formatTime(block.start)} - {formatTime(block.end)}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 ml-2">
                          {block.type === 'suggestion' && (
                            <>
                              {/* Pencil In/Out Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const suggestionId = block.id.replace('suggestion-', '');
                                  handlePencilToggle(suggestionId);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  block.isPenciledIn 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                                title={block.isPenciledIn ? 'Unpencil (AI can move)' : 'Pencil In (AI won\'t move)'}
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                              </button>

                              {/* Approve/Deny Buttons */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (block.originalData) {
                                    onSuggestionApprove(block.originalData as AIScheduleSuggestion);
                                  }
                                }}
                                className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                title="Approve suggestion"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const suggestionId = block.id.replace('suggestion-', '');
                                  onSuggestionDeny(suggestionId);
                                }}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                title="Deny suggestion"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions
function getEventColor(event: CalendarEvent): string {
  switch (event.type) {
    case 'deadline':
      return 'bg-red-100 border-red-500 text-red-800';
    case 'work_session':
      if (event.metadata?.timeBlocked) {
        return 'bg-red-100 border-red-500 text-red-800';
      }
      return event.source === 'ai_generated' ? 'bg-purple-100 border-purple-500 text-purple-800' : 'bg-blue-100 border-blue-500 text-blue-800';
    case 'counseling_session':
      return 'bg-teal-100 border-teal-500 text-teal-800';
    case 'wellness_break':
      return 'bg-blue-100 border-blue-500 text-blue-800';
    case 'health_break':
    case 'meal_break':
      return 'bg-orange-100 border-orange-500 text-orange-800';
    case 'event':
      return 'bg-green-100 border-green-500 text-green-800';
    default:
      return 'bg-gray-100 border-gray-500 text-gray-800';
  }
}

function getEventIcon(event: CalendarEvent): string {
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
}

export default EnhancedDayView;