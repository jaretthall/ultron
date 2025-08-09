import React, { useMemo, useState, useEffect } from 'react';
import { CalendarEvent } from '../../../services/calendarIntegrationService';

interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  selectedDate,
  events,
  onDateSelect,
  onEventClick,
  onEventDrop
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: Date; hour: number } | null>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate week days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    let dayOfWeek = startOfWeek.getDay();
    // Adjust so Monday is 0, Sunday is 6
    dayOfWeek = (dayOfWeek + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek.getTime()); // clone the date
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Generate time slots (8 AM to 10 PM) with larger spacing
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 22; hour++) {
      slots.push({
        time: hour,
        label: hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
        fullLabel: hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`
      });
    }
    return slots;
  }, []);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    
    weekDays.forEach(day => {
      const dayKey = day.toISOString().split('T')[0];
      grouped[dayKey] = [];
    });

    events.forEach(event => {
      const eventDay = event.start.toISOString().split('T')[0];
      if (grouped[eventDay]) {
        grouped[eventDay].push(event);
      }
    });

    // Sort events by start time within each day
    Object.keys(grouped).forEach(dayKey => {
      grouped[dayKey].sort((a, b) => a.start.getTime() - b.start.getTime());
    });

    return grouped;
  }, [weekDays, events]);

  // Calculate event positioning with larger blocks
  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinutes = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinutes = event.end.getMinutes();

    // Calculate position within the time grid (8 AM = 0, 10 PM = 14) with larger spacing
    const hourHeight = 80; // Increased from 60px to 80px for better visibility
    const topPosition = ((startHour - 8) + (startMinutes / 60)) * hourHeight;
    const duration = ((endHour - startHour) + ((endMinutes - startMinutes) / 60));
    const height = Math.max(duration * hourHeight, 50); // Minimum 50px height (increased from 30px)

    return {
      top: `${topPosition}px`,
      height: `${height}px`
    };
  };

  // Get event color based on type and priority - using sidebar-like styling
  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'deadline':
        return 'bg-red-600 border-red-700 text-white shadow-lg';
      case 'work_session':
        if (event.metadata?.timeBlocked) {
          return 'bg-red-600 border-red-700 text-white shadow-lg';
        }
        if (event.source === 'ai_generated') {
          return 'bg-purple-600 border-purple-700 text-white shadow-lg';
        }
        return 'bg-blue-600 border-blue-700 text-white shadow-lg';
      case 'counseling_session':
        return 'bg-teal-600 border-teal-700 text-white shadow-lg';
      case 'event':
        if (event.title.toLowerCase().includes('counseling')) {
          return 'bg-teal-600 border-teal-700 text-white shadow-lg';
        }
        return 'bg-green-600 border-green-700 text-white shadow-lg';
      default:
        return 'bg-gray-600 border-gray-700 text-white shadow-lg';
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
      case 'event':
        return '📅';
      default:
        return '•';
    }
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (!onEventDrop) return;
    
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, day: Date, hour: number) => {
    if (!draggedEvent || !onEventDrop) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ day, hour });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    
    if (!draggedEvent || !onEventDrop) return;
    
    const newStart = new Date(day);
    newStart.setHours(hour, 0, 0, 0);
    
    const duration = draggedEvent.end.getTime() - draggedEvent.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    
    onEventDrop(draggedEvent, newStart, newEnd);
    
    setDraggedEvent(null);
    setDragOverSlot(null);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Time column header */}
        <div className="p-3 border-r border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</div>
        </div>
        
        {/* Day headers */}
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-3 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
            <button
              onClick={() => onDateSelect(day)}
              className={`w-full text-left transition-colors rounded-md p-2 hover:bg-blue-50 dark:hover:bg-gray-700 ${
                isSelected(day) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200' : ''
              } ${isToday(day) ? 'font-bold text-blue-600' : 'text-gray-900 dark:text-gray-100'}`}
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {day.toLocaleDateString('en-US', { weekday: isMobile ? 'short' : 'long' })}
              </div>
              <div className={`text-lg font-medium mt-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-900 dark:text-gray-100'}`}>
                {day.getDate()}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Tasks/All-day events section at the top */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 max-h-32 overflow-auto">
        <div className="grid grid-cols-8">
          <div className="p-2 border-r border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 font-medium">
            Tasks
          </div>
          {weekDays.map((day) => {
            const dayKey = day.toISOString().split('T')[0];
            const dayTasksAndEvents = (eventsByDay[dayKey] || []).filter(event => {
              // Show all-day events and deadlines WITHOUT specific times at the top, but NOT time-blocked tasks
              if (event.metadata?.timeBlocked) return false; // Exclude time-blocked tasks from top section
              
              if (event.type === 'deadline') {
                // Show deadlines at top only if they don't have a specific time (all-day deadlines)
                return event.start.getHours() === 0 && event.start.getMinutes() === 0 && 
                       event.end.getHours() === 0 && event.end.getMinutes() === 0;
              }
              
              // Show other all-day events
              return event.end.getTime() - event.start.getTime() >= 24 * 60 * 60 * 1000 || // 24+ hours
                     (event.start.getHours() === 0 && event.end.getHours() === 23); // All day
            });

            return (
              <div key={dayKey} className="p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[4rem]">
                {dayTasksAndEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`text-sm rounded-lg px-3 py-2 mb-2 cursor-pointer ${getEventColor(event)} hover:shadow-lg hover:scale-105 transition-all duration-200`}
                    onClick={() => onEventClick(event)}
                    title={event.title}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getEventIcon(event)}</span>
                      <span className="truncate font-medium">{event.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 min-h-full">
          {/* Time column */}
          <div className="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {timeSlots.map((slot) => (
              <div key={slot.time} className="h-20 border-b border-gray-100 dark:border-gray-700 p-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                {slot.label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayKey = day.toISOString().split('T')[0];
            const dayEvents = (eventsByDay[dayKey] || []).filter(event => {
              // Show timed events here: work sessions, counseling sessions, time-blocked tasks, and timed deadlines
              
              // Always show time-blocked tasks in the grid
              if (event.metadata?.timeBlocked) return true;
              
              // Show deadlines that have specific times
              if (event.type === 'deadline') {
                return !(event.start.getHours() === 0 && event.start.getMinutes() === 0 && 
                        event.end.getHours() === 0 && event.end.getMinutes() === 0);
              }
              
              // Show other timed events (not all-day)
              return event.end.getTime() - event.start.getTime() < 24 * 60 * 60 * 1000 && // Less than 24 hours
                     !(event.start.getHours() === 0 && event.end.getHours() === 23); // Not all day
            });

            return (
              <div key={dayKey} className="border-r border-gray-200 dark:border-gray-700 last:border-r-0 relative">
                {/* Time grid background */}
                {timeSlots.map((slot) => (
                  <div
                    key={slot.time}
                    className={`h-20 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                      dragOverSlot && dragOverSlot.day.toDateString() === day.toDateString() && dragOverSlot.hour === slot.time
                        ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600'
                        : ''
                    }`}
                    onClick={() => onDateSelect(day)}
                    onDragOver={(e) => handleDragOver(e, day, slot.time)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day, slot.time)}
                  />
                ))}

                {/* Events overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {dayEvents.map((event) => {
                    const style = getEventStyle(event);
                    const colorClass = getEventColor(event);
                    const icon = getEventIcon(event);

                    return (
                      <div
                        key={event.id}
                        className={`absolute left-2 right-2 rounded-lg border-2 p-2 cursor-pointer pointer-events-auto ${colorClass} hover:shadow-xl hover:scale-105 transition-all duration-200 overflow-hidden ${
                          draggedEvent?.id === event.id ? 'opacity-50' : ''
                        }`}
                        style={style}
                        draggable={!!onEventDrop}
                        onClick={() => onEventClick(event)}
                        onDragStart={(e) => handleDragStart(e, event)}
                        onDragEnd={handleDragEnd}
                        title={`${event.title}\n${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}\n\nClick to edit this ${
                          event.metadata?.timeBlocked ? 'time-blocked task' :
                          event.source === 'ai_generated' ? 'AI suggested work session' :
                          event.type === 'work_session' ? 'work session' :
                          event.type === 'deadline' ? 'deadline' : 'event'
                        }`}
                      >
                        <div className="flex items-start gap-1 h-full overflow-hidden">
                          <span className="text-xs flex-shrink-0">{icon}</span>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="text-xs font-semibold leading-tight" title={event.title}>
                              <div className="truncate">
                                {event.title}
                              </div>
                            </div>
                            <div className="text-xs opacity-90 truncate">
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
                              <div className="text-xs opacity-75 bg-white/20 rounded px-1 py-0.5 inline-block truncate max-w-full">
                                {event.metadata.estimatedHours}h
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default WeekView;