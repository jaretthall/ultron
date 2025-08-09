import React, { useMemo, useState, useEffect } from 'react';
import { CalendarEvent } from '../../../services/calendarIntegrationService';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
}

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onEventDrop
}) => {
  // const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ hour: number; minutes: number } | null>(null);

  // Detect mobile screen size
  // useEffect(() => {
  //   const checkMobile = () => {
  //     setIsMobile(window.innerWidth < 768);
  //   };
  //   
  //   checkMobile();
  //   window.addEventListener('resize', checkMobile);
  //   return () => window.removeEventListener('resize', checkMobile);
  // }, []);

  // Update current time every minute to show the current time indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Generate detailed time slots (every 30 minutes from 6 AM to 11 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      // Full hour
      slots.push({
        time: hour,
        minutes: 0,
        label: hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`,
        isHour: true
      });
      
      // Half hour (except for the last slot)
      if (hour < 23) {
        slots.push({
          time: hour,
          minutes: 30,
          label: hour === 12 ? '12:30 PM' : hour > 12 ? `${hour - 12}:30 PM` : `${hour}:30 AM`,
          isHour: false
        });
      }
    }
    return slots;
  }, []);

  // Filter events for the current day
  const dayEvents = useMemo(() => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      return event.start >= dayStart && event.start <= dayEnd;
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [currentDate, events]);

  // Calculate event positioning with overlap detection
  const getEventLayout = (events: CalendarEvent[]) => {
    return events.map((event, index) => {
      const startHour = event.start.getHours();
      const startMinutes = event.start.getMinutes();
      const endHour = event.end.getHours();
      const endMinutes = event.end.getMinutes();

      // Calculate position within the time grid (6 AM = 0)
      const topPosition = ((startHour - 6) * 2 + (startMinutes >= 30 ? 1 : 0)) * 40; // 40px per 30-min slot
      const durationMinutes = (endHour - startHour) * 60 + (endMinutes - startMinutes);
      const height = Math.max((durationMinutes / 30) * 40, 20); // Minimum 20px height

      // Simple overlap detection
      const overlappingEvents = events.filter((otherEvent, otherIndex) => {
        if (otherIndex >= index) return false; // Only check previous events
        return event.start < otherEvent.end && event.end > otherEvent.start;
      });

      const leftOffset = overlappingEvents.length * 10; // 10px offset per overlap
      const width = `calc(100% - ${overlappingEvents.length * 10}px)`;

      return {
        event,
        style: {
          top: `${topPosition}px`,
          height: `${height}px`,
          left: `${leftOffset}px`,
          width: width,
          zIndex: 10 + index
        }
      };
    });
  };

  const eventLayout = useMemo(() => getEventLayout(dayEvents), [dayEvents]);

  // Get event color based on type and priority
  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'deadline':
        return 'bg-red-500 border-red-600 text-white shadow-red-100';
      case 'work_session':
        if (event.source === 'ai_generated') {
          return 'bg-purple-500 border-purple-600 text-white shadow-purple-100';
        }
        return 'bg-blue-500 border-blue-600 text-white shadow-blue-100';
      case 'counseling_session':
        return 'bg-teal-500 border-teal-600 text-white shadow-teal-100';
      case 'event':
        return 'bg-green-500 border-green-600 text-white shadow-green-100';
      default:
        return 'bg-gray-500 border-gray-600 text-white shadow-gray-100';
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (!onEventDrop) return;
    
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    
    // Add visual feedback
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.7';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, hour: number, minutes: number = 0) => {
    if (!draggedEvent || !onEventDrop) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ hour, minutes });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, hour: number, minutes: number = 0) => {
    e.preventDefault();
    
    if (!draggedEvent || !onEventDrop) return;
    
    // Calculate new start and end times
    const newStart = new Date(currentDate);
    newStart.setHours(hour, minutes, 0, 0);
    
    const duration = draggedEvent.end.getTime() - draggedEvent.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    
    // Call the drop handler
    onEventDrop(draggedEvent, newStart, newEnd);
    
    // Reset drag state
    setDraggedEvent(null);
    setDragOverSlot(null);
  };

  // Check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  // Calculate current time indicator position
  const getCurrentTimePosition = () => {
    if (!isSameDay(currentTime, currentDate)) return null;

    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    if (currentHour < 6 || currentHour > 23) return null;

    const position = ((currentHour - 6) * 2 + (currentMinutes / 30)) * 40;
    return position;
  };

  const currentTimePosition = getCurrentTimePosition();

  // Format day header
  const dayHeader = useMemo(() => {
    const isToday = isSameDay(currentDate, new Date());
    return {
      weekday: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
      date: currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      isToday
    };
  }, [currentDate]);

  // Get priority indicator
  const getPriorityDot = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <div className="w-2 h-2 rounded-full bg-red-400 inline-block mr-1" />;
      case 'high':
        return <div className="w-2 h-2 rounded-full bg-orange-400 inline-block mr-1" />;
      case 'medium':
        return <div className="w-2 h-2 rounded-full bg-yellow-400 inline-block mr-1" />;
      case 'low':
        return <div className="w-2 h-2 rounded-full bg-green-400 inline-block mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Day Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-semibold ${dayHeader.isToday ? 'text-blue-600' : 'text-gray-900 dark:text-gray-100'}`}>
              {dayHeader.weekday}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {dayHeader.date}
              {dayHeader.isToday && <span className="ml-2 text-blue-600 font-medium">Today</span>}
            </p>
          </div>
          
          {/* Event summary */}
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {dayEvents.length} {dayEvents.length === 1 ? 'Event' : 'Events'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {dayEvents.filter(e => e.type === 'work_session').length} Work Sessions, {' '}
              {dayEvents.filter(e => e.type === 'deadline').length} Deadlines
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      {dayEvents.filter(e => e.type === 'deadline').length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tasks & Deadlines</h3>
          <div className="flex flex-wrap gap-2">
            {dayEvents.filter(e => e.type === 'deadline').map((event) => (
              <div
                key={event.id}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs cursor-pointer ${getEventColor(event)} hover:shadow-sm transition-shadow`}
                onClick={() => onEventClick(event)}
                title={event.title}
              >
                <span>{getEventIcon(event)}</span>
                <span className="truncate max-w-[200px]">{event.title}</span>
                {event.priority && (
                  <span className="ml-1 opacity-75">({event.priority})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Time Labels */}
          <div className="w-20 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {timeSlots.map((slot) => (
              <div
                key={`${slot.time}-${slot.minutes}`}
                className={`h-10 border-b border-gray-100 dark:border-gray-800 flex items-center px-2 text-xs ${
                  slot.isHour ? 'font-medium text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {slot.isHour && (
                  <div className="text-right w-full">
                    {slot.label}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Events Area */}
          <div className="flex-1 relative">
            {/* Time grid background */}
            {timeSlots.map((slot) => (
              <div
                key={`${slot.time}-${slot.minutes}-bg`}
                className={`h-10 border-b hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                  slot.isHour ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100/50 dark:border-gray-800/50'
                } ${
                  dragOverSlot && dragOverSlot.hour === slot.time && dragOverSlot.minutes === slot.minutes
                    ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600'
                    : ''
                }`}
                title={`${slot.label} - Click to add event`}
                onDragOver={(e) => handleDragOver(e, slot.time, slot.minutes)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, slot.time, slot.minutes)}
              />
            ))}

            {/* Current time indicator */}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
                <div className="text-xs text-red-600 font-medium ml-4 -mt-1">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            )}

            {/* Events */}
            {eventLayout.map(({ event, style }) => {
              const colorClass = getEventColor(event);
              const icon = getEventIcon(event);

              return (
                <div
                  key={event.id}
                  className={`absolute rounded-lg border-l-4 p-3 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 ${colorClass} ${
                    draggedEvent?.id === event.id ? 'opacity-50' : ''
                  }`}
                  style={style}
                  draggable={!!onEventDrop}
                  onClick={() => onEventClick(event)}
                  onDragStart={(e) => handleDragStart(e, event)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        {getPriorityDot(event.priority)}
                        <h3 className="font-semibold text-sm truncate">
                          {event.title}
                        </h3>
                      </div>
                      
                      <div className="text-xs opacity-90 mb-2">
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

                      {/* Event metadata */}
                      <div className="space-y-1">
                        {event.metadata?.estimatedHours && (
                          <div className="text-xs opacity-75 flex items-center gap-1">
                            <span>⏱️</span>
                            <span>{event.metadata.estimatedHours}h estimated</span>
                          </div>
                        )}
                        
                        {event.metadata?.progress !== undefined && (
                          <div className="text-xs opacity-75 flex items-center gap-1">
                            <span>📊</span>
                            <span>{event.metadata.progress}% complete</span>
                          </div>
                        )}

                        {event.metadata?.energyLevel && (
                          <div className="text-xs opacity-75 flex items-center gap-1">
                            <span>⚡</span>
                            <span>{event.metadata.energyLevel} energy</span>
                          </div>
                        )}

                        {event.metadata?.aiSuggested && (
                          <div className="text-xs opacity-75 flex items-center gap-1">
                            <span>🤖</span>
                            <span>AI suggested</span>
                          </div>
                        )}
                      </div>

                      {/* Event type indicator */}
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-white bg-opacity-20">
                          {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {dayEvents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No events scheduled</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click on a time slot to add an event</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Day Summary Footer */}
      {dayEvents.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {dayEvents.filter(e => e.type === 'work_session').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Work Sessions</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {dayEvents.filter(e => e.type === 'deadline').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Deadlines</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {dayEvents.filter(e => e.type === 'event').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Events</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {dayEvents.filter(e => e.metadata?.aiSuggested).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">AI Suggested</div>
            </div>
          </div>
          
          {/* Total time breakdown */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total scheduled time:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {Math.round(
                  dayEvents
                    .filter(e => e.type === 'work_session')
                    .reduce((total, event) => {
                      const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
                      return total + duration;
                    }, 0) * 10
                ) / 10}h
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayView;