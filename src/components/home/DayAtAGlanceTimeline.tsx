import React, { useState, useEffect } from 'react';
import { CalendarEvent, calendarIntegrationService } from '../../services/calendarIntegrationService';
import { Task } from '../../../types';

interface DayAtAGlanceTimelineProps {
  tasks: Task[];
  onEventClick?: (event: CalendarEvent) => void;
}

const DayAtAGlanceTimeline: React.FC<DayAtAGlanceTimelineProps> = ({ tasks, onEventClick }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Load today's events
  useEffect(() => {
    const loadTodaysEvents = async () => {
      try {
        setIsLoading(true);
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        
        const calendarData = await calendarIntegrationService.getCalendarData(startOfDay, endOfDay);
        
        // Sort events by start time
        const sortedEvents = calendarData.events.sort((a, b) => 
          a.start.getTime() - b.start.getTime()
        );
        
        setEvents(sortedEvents);
      } catch (error) {
        console.error('Failed to load today\'s events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodaysEvents();
  }, [tasks]);

  const getEventColor = (event: CalendarEvent): string => {
    switch (event.type) {
      case 'deadline':
        return 'bg-red-500 border-red-400';
      case 'work_session':
        return event.source === 'ai_generated' ? 'bg-purple-500 border-purple-400' : 'bg-blue-500 border-blue-400';
      case 'counseling_session':
        return 'bg-green-500 border-green-400';
      case 'meal_break':
        return 'bg-emerald-500 border-emerald-400';
      case 'health_break':
        return 'bg-teal-500 border-teal-400';
      case 'event':
        return 'bg-yellow-500 border-yellow-400';
      default:
        return 'bg-slate-500 border-slate-400';
    }
  };

  const getEventIcon = (event: CalendarEvent): string => {
    switch (event.type) {
      case 'deadline':
        return '📅';
      case 'work_session':
        return event.source === 'ai_generated' ? '🤖' : '🔨';
      case 'counseling_session':
        return '👥';
      case 'meal_break':
        return '🍽️';
      case 'health_break':
        return '⏰';
      case 'event':
        return '📋';
      default:
        return '⭐';
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isEventActive = (event: CalendarEvent): boolean => {
    return currentTime >= event.start && currentTime <= event.end;
  };

  const isEventUpcoming = (event: CalendarEvent): boolean => {
    return currentTime < event.start;
  };

  const calculateProgress = (): number => {
    const now = currentTime;
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0); // 8 AM start
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0); // 5 PM end
    
    if (now < startOfDay) return 0;
    if (now > endOfDay) return 100;
    
    const totalMinutes = (endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60);
    const elapsedMinutes = (now.getTime() - startOfDay.getTime()) / (1000 * 60);
    
    return Math.round((elapsedMinutes / totalMinutes) * 100);
  };

  const getScheduledTimePercentage = (): number => {
    const workingHours = 9 * 60; // 9 hours in minutes (8 AM - 5 PM)
    const scheduledMinutes = events.reduce((total, event) => {
      const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
      return total + duration;
    }, 0);
    
    return Math.min(Math.round((scheduledMinutes / workingHours) * 100), 100);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Day at a Glance</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
          <span className="ml-3 text-slate-400">Loading timeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Day at a Glance</h2>
        <div className="text-sm text-slate-400">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Daily Progress</span>
          <span>{calculateProgress()}% complete</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-sky-400 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>8:00 AM</span>
          <span>{getScheduledTimePercentage()}% scheduled</span>
          <span>5:00 PM</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-400 mb-3">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-400">No events scheduled for today</p>
            <p className="text-xs text-slate-500 mt-1">Add tasks with due dates or work sessions to see them here</p>
          </div>
        ) : (
          events.map((event, index) => {
            const isActive = isEventActive(event);
            const isUpcoming = isEventUpcoming(event);
            const isPast = !isActive && !isUpcoming;
            
            return (
              <div
                key={event.id}
                className={`relative flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-slate-700/50 ${
                  isActive 
                    ? 'bg-slate-700 border-sky-400 shadow-lg' 
                    : isPast 
                    ? 'opacity-60 border-slate-600' 
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                onClick={() => onEventClick?.(event)}
              >
                {/* Timeline connector */}
                {index < events.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-slate-600"></div>
                )}
                
                {/* Event icon */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${getEventColor(event)} ${
                  isActive ? 'animate-pulse' : ''
                }`}>
                  <span className="text-white">{getEventIcon(event)}</span>
                </div>
                
                {/* Event details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium truncate ${
                      isActive ? 'text-white' : isPast ? 'text-slate-400' : 'text-slate-200'
                    }`}>
                      {event.title}
                    </h3>
                    {isActive && (
                      <span className="text-xs text-sky-400 font-medium">ACTIVE</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs ${isPast ? 'text-slate-500' : 'text-slate-400'}`}>
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </span>
                    
                    {event.priority && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        event.priority === 'urgent' ? 'bg-red-600 text-white' :
                        event.priority === 'high' ? 'bg-orange-600 text-white' :
                        event.priority === 'medium' ? 'bg-yellow-600 text-white' :
                        'bg-green-600 text-white'
                      }`}>
                        {event.priority}
                      </span>
                    )}
                    
                    {event.source === 'ai_generated' && (
                      <span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded">
                        AI
                      </span>
                    )}
                  </div>
                  
                  {event.metadata?.estimatedHours && (
                    <div className="text-xs text-slate-500 mt-1">
                      Est. {event.metadata.estimatedHours}h
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary footer */}
      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{events.length} events today</span>
            <span>
              {events.filter(e => isEventActive(e)).length} active • {events.filter(e => isEventUpcoming(e)).length} upcoming
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayAtAGlanceTimeline;