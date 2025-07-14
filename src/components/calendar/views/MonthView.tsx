import React, { useMemo, useState, useEffect } from 'react';
import { CalendarEvent } from '../../../services/calendarIntegrationService';

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  selectedDate,
  events,
  onDateSelect,
  onEventClick,
  onEventDrop
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const daysOfWeek = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);

  // Calculate month grid
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Previous month days (for grid alignment)
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isPrevMonth: true,
        isNextMonth: false
      });
    }
    
    // Current month days
    for (let day = 1; day <= numDays; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false
      });
    }
    
    // Next month days (to fill grid)
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true
      });
    }
    
    return days;
  }, [currentDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      const dateKey = event.start.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    // Sort events by start time within each day
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => a.start.getTime() - b.start.getTime());
    });
    
    return grouped;
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateKey = date.toISOString().split('T')[0];
    const dayEvents = eventsByDate[dateKey] || [];
    
    // Debug July 14th specifically
    if (date.getDate() === 14 && date.getMonth() === 6) { // July = month 6
      console.log('📅 MonthView July 14th events:', {
        dateKey,
        eventsFound: dayEvents.length,
        deadlines: dayEvents.filter(e => e.type === 'deadline').length,
        deadlineEvents: dayEvents.filter(e => e.type === 'deadline').map(d => ({ id: d.id, title: d.title, start: d.start })),
        allEventTypes: dayEvents.map(e => ({ type: e.type, title: e.title }))
      });
    }
    
    return dayEvents;
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

  // Get event color class
  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'deadline':
        return 'bg-red-500';
      case 'work_session':
        return event.source === 'ai_generated' ? 'bg-purple-500' : 'bg-blue-500';
      case 'counseling_session':
        return 'bg-teal-500';
      case 'wellness_break':
        return 'bg-blue-500';
      case 'health_break':
      case 'meal_break':
        return 'bg-orange-500';
      case 'event':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
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

  // Handle cell click
  const handleCellClick = (date: Date) => {
    onDateSelect(date);
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick(event);
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
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    if (!draggedEvent || !onEventDrop) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    
    if (!draggedEvent || !onEventDrop) return;
    
    // For month view, we'll move the event to the same time but on the new date
    const newStart = new Date(date);
    newStart.setHours(draggedEvent.start.getHours(), draggedEvent.start.getMinutes(), 0, 0);
    
    const duration = draggedEvent.end.getTime() - draggedEvent.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    
    onEventDrop(draggedEvent, newStart, newEnd);
    
    setDraggedEvent(null);
    setDragOverDate(null);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Month Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-7">
          {daysOfWeek.map((day) => (
            <div key={day} className="p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isMobile ? day.charAt(0) : day}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 min-h-full">
          {monthGrid.map((dayData) => {
            const { date, isCurrentMonth } = dayData;
            const dayEvents = getEventsForDate(date);
            const isDateToday = isToday(date);
            const isDateSelected = isSelected(date);

            return (
              <div
                key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                className={`border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer transition-colors min-h-[120px] lg:min-h-[140px] flex flex-col ${
                  isDateSelected 
                    ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 ring-inset' 
                    : isDateToday 
                    ? 'bg-blue-25 dark:bg-blue-900/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                } ${
                  !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800' : ''
                } ${
                  dragOverDate && dragOverDate.toDateString() === date.toDateString()
                    ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-300 dark:ring-blue-600'
                    : ''
                }`}
                onClick={() => handleCellClick(date)}
                onDragOver={(e) => handleDragOver(e, date)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, date)}
              >
                {/* Date number */}
                <div className="p-2 flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isDateToday 
                      ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                      : isCurrentMonth 
                      ? 'text-gray-900 dark:text-gray-100' 
                      : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {date.getDate()}
                  </span>
                  
                  {/* Event count indicator */}
                  {dayEvents.length > 0 && (
                    <div className="flex items-center gap-1">
                      {/* Show individual event dots for small counts */}
                      {dayEvents.length <= 3 ? (
                        dayEvents.map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={`w-2 h-2 rounded-full ${getEventColor(event)}`}
                            title={event.title}
                          />
                        ))
                      ) : (
                        <div className="text-xs text-gray-600 font-medium bg-gray-200 rounded-full px-2 py-1">
                          {dayEvents.length}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Events list */}
                <div className="flex-1 px-2 pb-2 space-y-1 overflow-hidden">
                  {dayEvents.slice(0, isMobile ? 2 : 4).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`${getEventColor(event)} text-white text-xs rounded px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity truncate ${
                        draggedEvent?.id === event.id ? 'opacity-50' : ''
                      }`}
                      draggable={!!onEventDrop}
                      onClick={(e) => handleEventClick(event, e)}
                      onDragStart={(e) => handleDragStart(e, event)}
                      onDragEnd={handleDragEnd}
                      title={`${event.title}\n${event.start.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })} - ${event.end.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs">{getEventIcon(event)}</span>
                        <span className="truncate">
                          {event.title.length > 15 ? `${event.title.substring(0, 15)}...` : event.title}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show more indicator */}
                  {dayEvents.length > (isMobile ? 2 : 4) && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - (isMobile ? 2 : 4)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month Footer with Summary */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {events.filter(e => e.type === 'work_session').length}
            </div>
            <div className="text-xs text-gray-600">Work Sessions</div>
          </div>
          
          <div>
            <div className="text-lg font-semibold text-red-600">
              {events.filter(e => e.type === 'deadline').length}
            </div>
            <div className="text-xs text-gray-600">Deadlines</div>
          </div>
          
          <div>
            <div className="text-lg font-semibold text-green-600">
              {events.filter(e => e.type === 'event').length}
            </div>
            <div className="text-xs text-gray-600">Events</div>
          </div>
          
          <div>
            <div className="text-lg font-semibold text-purple-600">
              {events.filter(e => e.metadata?.aiSuggested).length}
            </div>
            <div className="text-xs text-gray-600">AI Suggested</div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-gray-600">Deadlines</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-gray-600">Work/Wellness</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span className="text-gray-600">AI Suggested</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-600">Events</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-teal-500"></div>
              <span className="text-gray-600">Counseling</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span className="text-gray-600">Health Breaks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthView;