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
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Generate time slots (8 AM to 10 PM)
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

  // Calculate event positioning
  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinutes = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinutes = event.end.getMinutes();

    // Calculate position within the time grid (8 AM = 0, 10 PM = 14)
    const topPosition = ((startHour - 8) + (startMinutes / 60)) * 60; // 60px per hour
    const duration = ((endHour - startHour) + ((endMinutes - startMinutes) / 60));
    const height = Math.max(duration * 60, 30); // Minimum 30px height

    return {
      top: `${topPosition}px`,
      height: `${height}px`
    };
  };

  // Get event color based on type and priority
  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'deadline':
        return 'bg-red-500 border-red-600 text-white';
      case 'work_session':
        if (event.source === 'ai_generated') {
          return 'bg-purple-500 border-purple-600 text-white';
        }
        return 'bg-blue-500 border-blue-600 text-white';
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
              // Show deadlines and all-day events at the top
              return event.type === 'deadline' || 
                     event.end.getTime() - event.start.getTime() >= 24 * 60 * 60 * 1000 || // 24+ hours
                     (event.start.getHours() === 0 && event.end.getHours() === 23); // All day
            });

            return (
              <div key={dayKey} className="p-1 border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[3rem]">
                {dayTasksAndEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs rounded px-2 py-1 mb-1 cursor-pointer ${getEventColor(event)} hover:shadow-sm transition-shadow`}
                    onClick={() => onEventClick(event)}
                    title={event.title}
                  >
                    <span className="mr-1">{getEventIcon(event)}</span>
                    <span className="truncate">{event.title}</span>
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
              <div key={slot.time} className="h-15 border-b border-gray-100 dark:border-gray-700 p-2 text-xs text-gray-500 dark:text-gray-400">
                {slot.label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayKey = day.toISOString().split('T')[0];
            const dayEvents = (eventsByDay[dayKey] || []).filter(event => {
              // Only show timed events here (not deadlines or all-day events)
              return event.type !== 'deadline' && 
                     event.end.getTime() - event.start.getTime() < 24 * 60 * 60 * 1000 && // Less than 24 hours
                     !(event.start.getHours() === 0 && event.end.getHours() === 23); // Not all day
            });

            return (
              <div key={dayKey} className="border-r border-gray-200 dark:border-gray-700 last:border-r-0 relative">
                {/* Time grid background */}
                {timeSlots.map((slot) => (
                  <div
                    key={slot.time}
                    className={`h-15 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
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
                        className={`absolute left-1 right-1 rounded-md border-l-4 p-2 cursor-pointer pointer-events-auto shadow-sm ${colorClass} hover:shadow-md transition-shadow ${
                          draggedEvent?.id === event.id ? 'opacity-50' : ''
                        }`}
                        style={style}
                        draggable={!!onEventDrop}
                        onClick={() => onEventClick(event)}
                        onDragStart={(e) => handleDragStart(e, event)}
                        onDragEnd={handleDragEnd}
                        title={`${event.title}\n${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}`}
                      >
                        <div className="flex items-start gap-1">
                          <span className="text-xs">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {event.title}
                            </div>
                            <div className="text-xs opacity-90">
                              {event.start.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </div>
                            {event.metadata?.estimatedHours && (
                              <div className="text-xs opacity-75">
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