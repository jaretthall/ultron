import React, { useState, useEffect } from 'react';
import { CalendarEvent, calendarIntegrationService } from '../../services/calendarIntegrationService';
import { Task, TaskStatus } from '../../../types';

interface SmartSummaryCardsProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const SmartSummaryCards: React.FC<SmartSummaryCardsProps> = ({ tasks, onTaskClick, onEventClick }) => {
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Load next event
  useEffect(() => {
    const loadNextEvent = async () => {
      try {
        setIsLoading(true);
        const now = new Date();
        const endOfWeek = new Date(now);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        
        const calendarData = await calendarIntegrationService.getCalendarData(now, endOfWeek);
        
        // Find next upcoming event
        const upcomingEvents = calendarData.events
          .filter(event => event.start > now)
          .sort((a, b) => a.start.getTime() - b.start.getTime());
        
        setNextEvent(upcomingEvents[0] || null);
      } catch (error) {
        console.error('Failed to load next event:', error);
        setNextEvent(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadNextEvent();
  }, [tasks]);

  const getTopPriorityTask = (): Task | null => {
    const activeTasks = tasks.filter(task => task.status !== TaskStatus.COMPLETED);
    
    // Sort by priority and due date
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    
    return activeTasks.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // If same priority, sort by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      
      return 0;
    })[0] || null;
  };

  const getAIWorkBlock = (): { suggestion: string; time: string } | null => {
    const now = currentTime;
    const hour = now.getHours();
    
    // Simple AI work block suggestions based on time of day
    if (hour >= 8 && hour < 10) {
      return {
        suggestion: "Morning Deep Work",
        time: "Next 2 hours"
      };
    } else if (hour >= 10 && hour < 12) {
      return {
        suggestion: "Creative Focus Block",
        time: "Before lunch"
      };
    } else if (hour >= 13 && hour < 15) {
      return {
        suggestion: "Afternoon Productivity",
        time: "Post-lunch energy"
      };
    } else if (hour >= 15 && hour < 17) {
      return {
        suggestion: "Task Completion",
        time: "End of day push"
      };
    } else if (hour >= 17) {
      return {
        suggestion: "Tomorrow's Prep",
        time: "Plan ahead"
      };
    }
    
    return {
      suggestion: "Flexible Work Time",
      time: "Available now"
    };
  };

  const calculateFreeTime = (): string => {
    const now = currentTime;
    
    if (nextEvent) {
      const timeUntilNext = Math.round((nextEvent.start.getTime() - now.getTime()) / (1000 * 60));
      
      if (timeUntilNext > 0) {
        if (timeUntilNext < 60) {
          return `${timeUntilNext}m until next event`;
        } else {
          const hours = Math.floor(timeUntilNext / 60);
          const minutes = timeUntilNext % 60;
          return `${hours}h ${minutes}m free`;
        }
      }
    }
    
    // Default free time calculation
    const endOfWorkDay = new Date(now);
    endOfWorkDay.setHours(17, 0, 0, 0);
    
    if (now < endOfWorkDay) {
      const freeMinutes = Math.round((endOfWorkDay.getTime() - now.getTime()) / (1000 * 60));
      const hours = Math.floor(freeMinutes / 60);
      return `${hours}h available today`;
    }
    
    return "Evening time";
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatRelativeTime = (date: Date): string => {
    const now = currentTime;
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 0) return "Past";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.round(diffMins / 60)}h`;
    return `${Math.round(diffMins / 1440)}d`;
  };

  const topTask = getTopPriorityTask();
  const aiWorkBlock = getAIWorkBlock();
  const freeTime = calculateFreeTime();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Smart Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Event Card */}
        <div 
          className={`bg-slate-800 rounded-lg p-4 border border-slate-600 transition-all duration-200 ${
            nextEvent ? 'hover:border-slate-500 cursor-pointer' : ''
          }`}
          onClick={() => nextEvent && onEventClick?.(nextEvent)}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-slate-300">Next Event</h3>
          </div>
          
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-2/3"></div>
            </div>
          ) : nextEvent ? (
            <div>
              <p className="text-white font-medium truncate">{nextEvent.title}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-400">
                  {formatTime(nextEvent.start)}
                </span>
                <span className="text-xs bg-sky-600 text-white px-2 py-1 rounded">
                  {formatRelativeTime(nextEvent.start)}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-slate-400">No upcoming events</p>
              <p className="text-xs text-slate-500 mt-1">Clear schedule ahead</p>
            </div>
          )}
        </div>

        {/* Top Priority Task Card */}
        <div 
          className={`bg-slate-800 rounded-lg p-4 border border-slate-600 transition-all duration-200 ${
            topTask ? 'hover:border-slate-500 cursor-pointer' : ''
          }`}
          onClick={() => topTask && onTaskClick?.(topTask)}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              topTask?.priority === 'urgent' ? 'bg-red-600' :
              topTask?.priority === 'high' ? 'bg-orange-600' :
              topTask?.priority === 'medium' ? 'bg-yellow-600' :
              'bg-green-600'
            }`}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-slate-300">Top Priority</h3>
          </div>
          
          {topTask ? (
            <div>
              <p className="text-white font-medium truncate">{topTask.title}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${
                  topTask.priority === 'urgent' ? 'bg-red-600 text-white' :
                  topTask.priority === 'high' ? 'bg-orange-600 text-white' :
                  topTask.priority === 'medium' ? 'bg-yellow-600 text-white' :
                  'bg-green-600 text-white'
                }`}>
                  {topTask.priority}
                </span>
                {topTask.due_date && (
                  <span className="text-xs text-slate-400">
                    Due {new Date(topTask.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-slate-400">No pending tasks</p>
              <p className="text-xs text-slate-500 mt-1">All caught up!</p>
            </div>
          )}
        </div>

        {/* AI Work Block Card */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-600 hover:border-purple-500 cursor-pointer transition-all duration-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-slate-300">AI Work Block</h3>
          </div>
          
          {aiWorkBlock && (
            <div>
              <p className="text-white font-medium">{aiWorkBlock.suggestion}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-400">{aiWorkBlock.time}</span>
                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                  Optimal
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Free Time Card */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-slate-300">Free Time</h3>
          </div>
          
          <div>
            <p className="text-white font-medium">{freeTime}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-slate-400">Available for focus work</span>
              <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded">
                Open
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="text-xs bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded transition-colors">
            Schedule Break
          </button>
          <button className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded transition-colors">
            AI Reschedule
          </button>
          <button className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors">
            Add Buffer Time
          </button>
          <button className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded transition-colors">
            Focus Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartSummaryCards;