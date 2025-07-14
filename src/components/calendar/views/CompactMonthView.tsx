import React, { useMemo, useState, useEffect } from 'react';
import { CalendarEvent } from '../../../services/calendarIntegrationService';

interface CompactMonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
}

interface EventIcon {
  event: CalendarEvent;
  icon: string;
  color: string;
  bgColor: string;
}

const CompactMonthView: React.FC<CompactMonthViewProps> = ({
  currentDate,
  selectedDate,
  events,
  onDateSelect,
  onEventClick
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

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

  // Convert events to icons
  const getEventIcon = (event: CalendarEvent): EventIcon => {
    switch (event.type) {
      case 'deadline':
        return {
          event,
          icon: '⏰',
          color: 'text-red-800',
          bgColor: 'bg-red-500'
        };
      case 'work_session':
        if (event.metadata?.timeBlocked) {
          return {
            event,
            icon: '🔴',
            color: 'text-red-800',
            bgColor: 'bg-red-500'
          };
        }
        if (event.source === 'ai_generated') {
          return {
            event,
            icon: '🤖',
            color: 'text-purple-800',
            bgColor: 'bg-purple-500'
          };
        }
        return {
          event,
          icon: '🔨',
          color: 'text-blue-800',
          bgColor: 'bg-blue-500'
        };
      case 'counseling_session':
        return {
          event,
          icon: '💬',
          color: 'text-teal-800',
          bgColor: 'bg-teal-500'
        };
      case 'wellness_break':
        if (event.title.includes('Lunch')) {
          return {
            event,
            icon: '🍽️',
            color: 'text-blue-800',
            bgColor: 'bg-blue-500'
          };
        }
        if (event.title.includes('Walk')) {
          return {
            event,
            icon: '🚶',
            color: 'text-blue-800',
            bgColor: 'bg-blue-500'
          };
        }
        if (event.title.includes('Meditation')) {
          return {
            event,
            icon: '🧘',
            color: 'text-blue-800',
            bgColor: 'bg-blue-500'
          };
        }
        return {
          event,
          icon: '✨',
          color: 'text-blue-800',
          bgColor: 'bg-blue-500'
        };
      case 'health_break':
      case 'meal_break':
        return {
          event,
          icon: '🍽️',
          color: 'text-orange-800',
          bgColor: 'bg-orange-500'
        };
      case 'event':
        return {
          event,
          icon: '📅',
          color: 'text-green-800',
          bgColor: 'bg-green-500'
        };
      default:
        return {
          event,
          icon: '•',
          color: 'text-gray-800',
          bgColor: 'bg-gray-500'
        };
    }
  };

  // Group events by date and convert to icons
  const iconsByDate = useMemo(() => {
    const grouped: { [key: string]: EventIcon[] } = {};
    
    events.forEach(event => {
      const dateKey = event.start.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(getEventIcon(event));
    });
    
    // Sort events by start time within each day
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => a.event.start.getTime() - b.event.start.getTime());
    });
    
    return grouped;
  }, [events]);

  // Check if date is selected
  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // Check if date is today
  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  // Handle icon hover
  const handleIconHover = (event: CalendarEvent, mouseEvent: React.MouseEvent) => {
    setHoveredEvent(event);
    setHoverPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY });
  };

  const handleIconLeave = () => {
    setHoveredEvent(null);
  };

  // Format time for tooltip
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="compact-month-view bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600 rounded-t-lg overflow-hidden">
        {daysOfWeek.map(day => (
          <div key={day} className="bg-gray-50 dark:bg-gray-700 p-2 text-center">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600 rounded-b-lg overflow-hidden">
        {monthGrid.map((day) => {
          const dateKey = day.date.toISOString().split('T')[0];
          const dayIcons = iconsByDate[dateKey] || [];
          const maxIconsToShow = isMobile ? 3 : 6;
          const visibleIcons = dayIcons.slice(0, maxIconsToShow);
          const overflowCount = dayIcons.length - maxIconsToShow;

          return (
            <div
              key={`${day.date.getMonth()}-${day.date.getDate()}`}
              className={`
                relative h-16 p-1 cursor-pointer transition-colors
                ${day.isCurrentMonth 
                  ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' 
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500'
                }
                ${isSelected(day.date) 
                  ? 'ring-2 ring-blue-500 ring-inset bg-blue-50 dark:bg-blue-900/30' 
                  : ''
                }
                ${isToday(day.date) && day.isCurrentMonth 
                  ? 'bg-blue-100 dark:bg-blue-900/50' 
                  : ''
                }
              `}
              onClick={() => handleDateClick(day.date)}
            >
              {/* Date Number */}
              <div className="text-xs font-medium text-center mb-1">
                {day.date.getDate()}
              </div>

              {/* Event Icons */}
              <div className="flex flex-wrap justify-center gap-0.5">
                {visibleIcons.map((iconData, iconIndex) => (
                  <div
                    key={`${iconData.event.id}-${iconIndex}`}
                    className={`
                      w-4 h-4 rounded-sm flex items-center justify-center cursor-pointer
                      ${iconData.bgColor} ${iconData.color} 
                      hover:scale-110 transition-transform
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(iconData.event);
                    }}
                    onMouseEnter={(e) => handleIconHover(iconData.event, e)}
                    onMouseLeave={handleIconLeave}
                    title={`${iconData.event.title} - ${formatTime(iconData.event.start)}`}
                  >
                    <span className="text-xs leading-none">{iconData.icon}</span>
                  </div>
                ))}

                {/* Overflow indicator */}
                {overflowCount > 0 && (
                  <div 
                    className="w-4 h-4 rounded-sm bg-gray-400 dark:bg-gray-600 flex items-center justify-center"
                    title={`${overflowCount} more event${overflowCount > 1 ? 's' : ''}`}
                  >
                    <span className="text-xs text-white font-bold">+</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover Tooltip */}
      {hoveredEvent && (
        <div
          className="fixed z-50 bg-gray-900 text-white p-2 rounded shadow-lg pointer-events-none max-w-xs"
          style={{
            left: hoverPosition.x + 10,
            top: hoverPosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="font-medium text-sm">{hoveredEvent.title}</div>
          <div className="text-xs opacity-75">
            {formatTime(hoveredEvent.start)} - {formatTime(hoveredEvent.end)}
          </div>
          {hoveredEvent.metadata?.estimatedHours && (
            <div className="text-xs opacity-75">
              Est. {hoveredEvent.metadata.estimatedHours}h
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Legend:</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-purple-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">🤖</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">AI Suggested</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">⏰</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">Deadlines</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">📅</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">Events</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-teal-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">💬</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">Counseling</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">✨</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">Wellness</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">🍽️</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">Health</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactMonthView;