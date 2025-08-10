import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, Schedule } from '../../../types';
import { useAppState } from '../../contexts/AppStateContext';
import { useAppMode } from '../../hooks/useLabels';
import { calendarIntegrationService, CalendarEvent, AIScheduleSuggestion } from '../../services/calendarIntegrationService';
import { EventShortcut, DEFAULT_QUICK_ACTIONS_PREFERENCES } from '../../types/userPreferences';
import { formatDateForInput } from '../../utils/dateUtils';

// Import existing modals
import NewTaskModal from '../tasks/NewTaskModal';
import EditTaskModal from '../tasks/EditTaskModal';
import NewEventModal from './NewEventModal';
import EditEventModal from './EditEventModal';
import EditWorkSessionModal from './EditWorkSessionModal';
import CounselingSessionModal from './CounselingSessionModal';

// Import view components (we'll create these)
import CompactMonthView from './views/CompactMonthView';
// import WeekView from './views/WeekView'; // Removed week view
// import DayView from './views/DayView';
import AISuggestionsPanel from './views/AISuggestionsPanel';
import EnhancedDayView from './EnhancedDayView';
import GlassPanel from '../common/GlassPanel';

// Icons
const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25m3 2.25H3.75m16.5 0v11.25A2.25 2.25 0 0119.5 21H4.5a2.25 2.25 0 01-2.25-2.25V8.25m16.5 0V6a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 6v2.25" />
  </svg>
);

// WeekIcon removed - no longer needed

// Removed DayIcon as it's no longer needed without day view

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

export type CalendarViewType = 'month';

interface EnhancedCalendarPageProps {
  onTaskClick?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
}

const EnhancedCalendarPage: React.FC<EnhancedCalendarPageProps> = ({ onTaskClick }) => {
  const { state, addTask, updateTask, addSchedule, updateSchedule, deleteSchedule } = useAppState();
  const { tasks, projects, schedules } = state;
  const [appMode] = useAppMode();

  // State for calendar navigation and view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewType] = useState<CalendarViewType>('month'); // setViewType removed - only month view now
  
  // Calendar data state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<AIScheduleSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Modal states
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showEditWorkSessionModal, setShowEditWorkSessionModal] = useState(false);
  const [showCounselingModal, setShowCounselingModal] = useState(false);
  const [activeShortcuts] = useState<EventShortcut[]>(DEFAULT_QUICK_ACTIONS_PREFERENCES.eventShortcuts);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);
  const [selectedWorkSession, setSelectedWorkSession] = useState<CalendarEvent | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load calendar data when date range or view changes
  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewType, tasks, schedules]);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on view type
      const { startDate, endDate } = getDateRangeForView(currentDate, viewType);
      
      console.log('Loading calendar data for range:', { startDate, endDate, viewType });
      
      const calendarData = await calendarIntegrationService.getCalendarData(startDate, endDate);
      
      setCalendarEvents(calendarData.events);
      setAISuggestions(calendarData.suggestions);
      
      console.log('Calendar data loaded:', {
        events: calendarData.events.length,
        suggestions: calendarData.suggestions.length
      });
      
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndRefreshAISuggestions = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on view type
      const { startDate, endDate } = getDateRangeForView(currentDate, viewType);
      
      console.log('🔄 Resetting and refreshing AI suggestions for range:', { startDate, endDate, viewType });
      
      const calendarData = await calendarIntegrationService.getCalendarDataWithReset(startDate, endDate);
      
      setCalendarEvents(calendarData.events);
      setAISuggestions(calendarData.suggestions);
      
      console.log('🔄 AI suggestions reset and reloaded:', {
        events: calendarData.events.length,
        suggestions: calendarData.suggestions.length
      });
      
    } catch (error) {
      console.error('Error resetting AI suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate date range for different view types
  const getDateRangeForView = (date: Date, view: CalendarViewType): { startDate: Date; endDate: Date } => {
    const startDate = new Date(date);
    const endDate = new Date(date);

    switch (view) {
      case 'month':
        // First day of month to last day of month
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        break;
      
      // Week case removed
      
      // Day view removed - no longer needed
    }

    // Reset time to start/end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  };

  // Navigation handlers
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    
    // Only month view now
    newDate.setMonth(newDate.getMonth() - 1);
    
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    
    // Only month view now
    newDate.setMonth(newDate.getMonth() + 1);
    
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Event handlers
  const handleEventClick = useCallback((event: CalendarEvent) => {
    console.log('Event clicked:', event);
    
    if (event.source === 'schedule' && event.scheduleId) {
      const schedule = schedules.find(s => s.id === event.scheduleId);
      if (schedule) {
        setSelectedEvent(schedule);
        setShowEditEventModal(true);
      }
    } else if (event.source === 'task' && event.taskId) {
      const task = tasks.find(t => t.id === event.taskId);
      if (task) {
        setEditingTask(task);
        if (onTaskClick) {
          onTaskClick(task);
        }
      }
    } else if (event.type === 'work_session' && (event.source === 'ai_generated' || event.source === 'manual')) {
      // Handle AI-generated or manual work sessions
      setSelectedWorkSession(event);
      setShowEditWorkSessionModal(true);
    }
  }, [schedules, tasks, onTaskClick]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleAISuggestionApprove = async (suggestion: AIScheduleSuggestion) => {
    try {
      await calendarIntegrationService.applySuggestion(suggestion);
      await loadCalendarData(); // Reload data to show the scheduled work session
    } catch (error) {
      console.error('Error applying AI suggestion:', error);
    }
  };

  const handleAISuggestionApproveAll = async (suggestions: AIScheduleSuggestion[]) => {
    try {
      for (const suggestion of suggestions) {
        await calendarIntegrationService.applySuggestion(suggestion);
      }
      await loadCalendarData(); // Reload data to show all scheduled work sessions
    } catch (error) {
      console.error('Error applying AI suggestions:', error);
    }
  };

  const handleAISuggestionApproveAndEdit = async (suggestions: AIScheduleSuggestion[], feedback: string) => {
    try {
      // Apply suggestions with feedback for modification
      await calendarIntegrationService.applySuggestionsWithFeedback(suggestions, feedback);
      await loadCalendarData(); // Reload data
    } catch (error) {
      console.error('Error applying AI suggestions with edits:', error);
    }
  };

  const handleAISuggestionProvideFeedback = async (feedback: string, commonIssues: string[]) => {
    try {
      // Request new AI plan with feedback
      await calendarIntegrationService.requestNewPlanWithFeedback(feedback, commonIssues);
      await loadCalendarData(); // Reload data to show new suggestions
    } catch (error) {
      console.error('Error providing feedback for new AI plan:', error);
    }
  };

  const handleSuggestionPencilIn = useCallback(async (suggestionId: string, isPenciledIn: boolean) => {
    try {
      console.log(`${isPenciledIn ? 'Penciling in' : 'Unpenciling'} suggestion:`, suggestionId);
      
      if (isPenciledIn) {
        // Mark as penciled in - AI should not move this suggestion
        const suggestion = aiSuggestions.find(s => s.id === suggestionId);
        if (suggestion) {
          await calendarIntegrationService.pencilInSuggestion(suggestion);
        }
      } else {
        // Unpencil - AI can move this suggestion again
        await calendarIntegrationService.unpencilSuggestion(suggestionId);
      }
      
      // Refresh calendar data to show updated penciled state
      await loadCalendarData();
    } catch (error) {
      console.error('Error updating penciled suggestion:', error);
    }
  }, [aiSuggestions]);

  const handleTimeBlockMove = useCallback(async (blockId: string, newStart: Date, newEnd: Date) => {
    try {
      console.log('Moving time block:', blockId, newStart, newEnd);
      
      if (blockId.startsWith('suggestion-')) {
        const suggestionId = blockId.replace('suggestion-', '');
        const suggestion = aiSuggestions.find(s => s.id === suggestionId);
        if (suggestion) {
          // Update suggestion time
          suggestion.suggestedStart = newStart;
          suggestion.suggestedEnd = newEnd;
          await calendarIntegrationService.applySuggestion(suggestion);
        }
      } else if (blockId.startsWith('event-')) {
        const eventId = blockId.replace('event-', '');
        const event = calendarEvents.find(e => e.id === eventId);
        if (event && event.scheduleId) {
          // Update event time
          await updateSchedule(event.scheduleId, {
            start_date: newStart.toISOString(),
            end_date: newEnd.toISOString()
          });
        }
      }
      
      await loadCalendarData();
    } catch (error) {
      console.error('Error moving time block:', error);
    }
  }, [aiSuggestions, calendarEvents, updateSchedule]);

  const handleAISuggestionDeny = async (suggestionId: string) => {
    try {
      await calendarIntegrationService.denySuggestion(suggestionId);
      setAISuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error denying AI suggestion:', error);
    }
  };

  // Commented out until the modify functionality is reimplemented
  // const handleAISuggestionModify = async (suggestion: AIScheduleSuggestion) => {
  //   try {
  //     // Apply the suggestion first to create the task
  //     await calendarIntegrationService.applySuggestion(suggestion);
  //     
  //     // Find the created task and open it for editing
  //     const task = tasks.find(t => t.id === suggestion.taskId);
  //     if (task) {
  //       setEditingTask(task);
  //     }
  //     
  //     await loadCalendarData(); // Reload data to show the scheduled work session
  //   } catch (error) {
  //     console.error('Error modifying AI suggestion:', error);
  //   }
  // };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask.id, updatedTask);
      setEditingTask(null);
      await loadCalendarData(); // Reload calendar data to reflect changes
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleEventDrop = async (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    try {
      if (event.source === 'schedule' && event.scheduleId) {
        const schedule = schedules.find(s => s.id === event.scheduleId);
        if (schedule) {
          await updateSchedule(event.scheduleId, {
            start_date: newStart.toISOString(),
            end_date: newEnd.toISOString()
          });
          await loadCalendarData(); // Reload calendar data to reflect changes
        }
      } else if ((event.source === 'task' || event.source === 'manual' || event.source === 'ai_generated') && event.taskId) {
        const task = tasks.find(t => t.id === event.taskId);
        if (task) {
          // Check if this is a deadline event or work session event
          if (event.type === 'deadline') {
            // Update due_date for deadline events
            await updateTask(event.taskId, {
              due_date: newStart.toISOString()
            });
          } else if (event.type === 'work_session') {
            // Check if this is a time-blocked task or work session
            if (event.metadata?.timeBlocked) {
              // Update scheduled_start and scheduled_end for time-blocked tasks
              await updateTask(event.taskId, {
                scheduled_start: newStart.toISOString(),
                scheduled_end: newEnd.toISOString()
              });
            } else {
              // Update work session schedule for work session events
              await updateTask(event.taskId, {
                work_session_scheduled_start: newStart.toISOString(),
                work_session_scheduled_end: newEnd.toISOString()
              });
            }
          }
          await loadCalendarData(); // Reload calendar data to reflect changes
        }
      }
    } catch (error) {
      console.error('Error updating event position:', error);
    }
  };

  // Work session handlers
  const handleWorkSessionSave = async (updatedEvent: CalendarEvent) => {
    try {
      if (updatedEvent.taskId) {
        const task = tasks.find(t => t.id === updatedEvent.taskId);
        if (task) {
          // Determine which fields to update based on event type
          if (updatedEvent.metadata?.timeBlocked) {
            // Update scheduled_start/end for time-blocked tasks
            await updateTask(updatedEvent.taskId, {
              scheduled_start: updatedEvent.start.toISOString(),
              scheduled_end: updatedEvent.end.toISOString()
            });
          } else {
            // Update work_session_scheduled_start/end for AI/manual work sessions
            await updateTask(updatedEvent.taskId, {
              work_session_scheduled_start: updatedEvent.start.toISOString(),
              work_session_scheduled_end: updatedEvent.end.toISOString()
            });
          }
          await loadCalendarData(); // Reload calendar data to reflect changes
        }
      }
    } catch (error) {
      console.error('Error saving work session:', error);
    }
  };

  const handleWorkSessionDelete = async (eventId: string) => {
    try {
      const event = calendarEvents.find(e => e.id === eventId);
      if (event && event.taskId) {
        const task = tasks.find(t => t.id === event.taskId);
        if (task) {
          // Clear the scheduling fields based on event type
          if (event.metadata?.timeBlocked) {
            // Clear scheduled_start/end for time-blocked tasks
            await updateTask(event.taskId, {
              scheduled_start: undefined,
              scheduled_end: undefined,
              is_time_blocked: false
            });
          } else {
            // Clear work_session_scheduled_start/end for AI/manual work sessions
            await updateTask(event.taskId, {
              work_session_scheduled_start: undefined,
              work_session_scheduled_end: undefined,
              ai_suggested: false
            });
          }
          await loadCalendarData(); // Reload calendar data to reflect changes
        }
      }
    } catch (error) {
      console.error('Error deleting work session:', error);
    }
  };

  // Format date for display - only month view now
  const formatDateRange = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, [currentDate]);

  // Handle shortcut button click
  const handleShortcutClick = useCallback(async (shortcut: EventShortcut) => {
    if (shortcut.id === 'counseling') {
      setShowCounselingModal(true);
      return;
    }

    // For other shortcuts, create event directly
    const newEvent: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
      title: shortcut.eventTitle,
      context: `Event created from ${shortcut.name} shortcut`,
      start_date: formatDateForInput(currentDate),
      end_date: formatDateForInput(new Date(currentDate.getTime() + shortcut.eventDuration * 60000)),
      location: '',
      tags: []
    };

    await addSchedule(newEvent);

    // Create accompanying task if specified
    if (shortcut.createTask && shortcut.taskTitle) {
      const newTask: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
        title: shortcut.taskTitle.replace('{eventName}', shortcut.eventTitle),
        description: `Follow-up task for ${shortcut.eventTitle}`,
        context: `Task automatically created from ${shortcut.name} shortcut for ${shortcut.eventTitle}`,
        priority: shortcut.taskPriority as any,
        status: 'TODO' as any,
        due_date: formatDateForInput(new Date(currentDate.getTime() + 24 * 60 * 60000)), // Due next day
        estimated_hours: 0,
        dependencies: [],
        tags: shortcut.taskTags,
        project_id: undefined
      };

      await addTask(newTask);
    }
  }, [currentDate, addSchedule, addTask]);

  // Filtered events for current view
  const filteredEvents = useMemo(() => {
    const { startDate, endDate } = getDateRangeForView(currentDate, viewType);
    
    return calendarEvents.filter(event => {
      return event.start >= startDate && event.start <= endDate;
    });
  }, [calendarEvents, currentDate, viewType]);

  // Count pending suggestions
  const pendingSuggestions = useMemo(() => {
    return aiSuggestions.filter(s => s.status === 'pending').length;
  }, [aiSuggestions]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <GlassPanel className="mx-2 md:mx-4 mt-3">
        <div className="flex flex-col gap-3">
          {/* Title and Date Range - Mobile optimized */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className={`font-bold text-gray-900 dark:text-gray-100 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                Calendar
              </h1>
              <button
                onClick={() => setShowFeaturesModal(true)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="View calendar features and mobile optimizations"
              >
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <div className={`font-medium text-gray-700 dark:text-gray-300 ${isMobile ? 'text-sm' : 'text-lg'}`}>
              {formatDateRange}
            </div>
          </div>

          {/* Controls - Mobile optimized layout */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* First row: Navigation + View Type */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              {/* Navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={navigatePrevious}
                  className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  aria-label="Previous"
                >
                  <ChevronLeftIcon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
                
                <button
                  onClick={navigateToday}
                  className={`${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-gray-900 dark:text-gray-100`}
                >
                  Today
                </button>
                
                <button
                  onClick={navigateNext}
                  className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  aria-label="Next"
                >
                  <ChevronRightIcon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
              </div>

              {/* Month View Label - Week view removed */}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CalendarIcon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {!isMobile && <span className="text-sm font-medium">Month View</span>}
              </div>
            </div>

            {/* Second row: Action buttons */}
            <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 overflow-x-auto">
              {/* AI Suggestions Buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (pendingSuggestions > 0) {
                      setShowAISuggestions(!showAISuggestions);
                    } else {
                      // Generate new AI suggestions with reset
                      resetAndRefreshAISuggestions();
                    }
                  }}
                  className={`relative ${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0`}
                  title={pendingSuggestions > 0 ? "View AI suggestions" : "Generate AI suggestions"}
                >
                  <SparklesIcon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  {!isMobile && <span>AI</span>}
                  {pendingSuggestions > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {pendingSuggestions}
                    </span>
                  )}
                </button>
                
                {/* Reset AI Suggestions Button */}
                <button
                  onClick={resetAndRefreshAISuggestions}
                  className={`${isMobile ? 'px-1.5 py-1.5' : 'px-2 py-2'} rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors flex items-center justify-center flex-shrink-0`}
                  title="Reset and refresh AI suggestions"
                  disabled={isLoading}
                >
                  <svg className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                {/* Debug Force AI Suggestions Button - RED BUTTON TEST */}
                <button
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      const { startDate, endDate } = getDateRangeForView(currentDate, viewType);
                      console.log('🔧 DEBUG: Force regenerating AI suggestions');
                      const calendarData = await calendarIntegrationService.forceRegenerateAISuggestions(startDate, endDate);
                      setCalendarEvents(calendarData.events);
                      setAISuggestions(calendarData.suggestions);
                      console.log('🔧 DEBUG: Force regenerated suggestions:', calendarData.suggestions.length);
                    } catch (error) {
                      console.error('🔧 DEBUG: Error force generating:', error);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className={`${isMobile ? 'px-1.5 py-1.5' : 'px-2 py-2'} rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center flex-shrink-0`}
                  title="DEBUG: Force regenerate AI suggestions - CLICK TO TEST"
                  disabled={isLoading}
                >
                  <svg className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>


              {/* Add Buttons */}
              <div className="flex gap-1 sm:gap-2">
                {/* Core actions */}
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className={`${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white hover:bg-white/[0.12] hover:border-white/[0.18] transition-all flex items-center gap-1 flex-shrink-0 group`}
                >
                  <PlusIcon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} group-hover:scale-110 transition-transform`} />
                  {!isMobile && <span>Task</span>}
                </button>
                
                <button
                  onClick={() => setShowNewEventModal(true)}
                  className={`${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white hover:bg-white/[0.12] hover:border-white/[0.18] transition-all flex items-center gap-1 flex-shrink-0 group`}
                >
                  <PlusIcon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} group-hover:scale-110 transition-transform`} />
                  {!isMobile && <span>Event</span>}
                </button>
                
                {/* Dynamic shortcut buttons */}
                {activeShortcuts
                  .filter(shortcut => shortcut.isActive && (appMode === 'business' || shortcut.id !== 'counseling'))
                  .map((shortcut) => {
                    const colorClasses = {
                      teal: 'hover:shadow-cyan-500/30',
                      blue: 'hover:shadow-blue-500/30',
                      slate: 'hover:shadow-slate-400/30',
                      emerald: 'hover:shadow-sky-500/30',
                      orange: 'hover:shadow-slate-400/30'
                    }[shortcut.color] || 'hover:shadow-blue-500/30';

                    return (
                      <button
                        key={shortcut.id}
                        onClick={() => handleShortcutClick(shortcut)}
                        className={`${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white hover:bg-white/[0.12] hover:border-white/[0.18] ${colorClasses} transition-all flex items-center gap-1 flex-shrink-0 group`}
                        title={`${shortcut.eventTitle}${shortcut.createTask ? ' with automatic task creation' : ''}`}
                      >
                        <span className={`${isMobile ? 'text-xs' : 'text-sm'} group-hover:scale-110 transition-transform`}>
                          {shortcut.icon}
                        </span>
                        {!isMobile && <span>{shortcut.name}</span>}
                      </button>
                    );
                  })
                }
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden relative p-2 md:p-4 gap-3">
        {/* Main Calendar View */}
        <GlassPanel className="flex-1 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!isLoading && (
            <>
              {viewType === 'month' && (
                <>
                  <CompactMonthView
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    events={filteredEvents}
                    onDateSelect={handleDateSelect}
                    onEventClick={handleEventClick}
                    onEventDrop={handleEventDrop}
                  />
                  
                  {/* Enhanced Day View underneath the calendar */}
                  <EnhancedDayView
                    selectedDate={selectedDate}
                    events={calendarEvents}
                    suggestions={aiSuggestions}
                    onEventClick={handleEventClick}
                    onSuggestionApprove={handleAISuggestionApprove}
                    onSuggestionDeny={handleAISuggestionDeny}
                    onSuggestionPencilIn={handleSuggestionPencilIn}
                    onTimeBlockMove={handleTimeBlockMove}
                  />
                </>
              )}

              {/* Week view removed */}
            </>
          )}
        </GlassPanel>


        {/* AI Suggestions Sidebar - Responsive */}
        {showAISuggestions && (
          <>
            {/* Mobile Overlay */}
            {isMobile && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setShowAISuggestions(false)}
              />
            )}
            <div className={`
              bg-white/5 backdrop-blur-xl border-l border-white/10 overflow-auto
              ${isMobile 
                ? 'fixed right-0 top-0 h-full w-full max-w-sm z-50 md:relative md:w-80' 
                : 'w-80 xl:w-96'
              }
            `}>
              <AISuggestionsPanel
                suggestions={aiSuggestions}
                onApprove={handleAISuggestionApprove}
                onApproveAll={handleAISuggestionApproveAll}
                onApproveAndEdit={handleAISuggestionApproveAndEdit}
                onProvideFeedback={handleAISuggestionProvideFeedback}
                onDeny={handleAISuggestionDeny}
                onRefresh={loadCalendarData}
                onReset={resetAndRefreshAISuggestions}
                onClose={() => setShowAISuggestions(false)}
              />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showNewTaskModal && (
        <NewTaskModal
          isOpen={showNewTaskModal}
          onClose={() => setShowNewTaskModal(false)}
          onAddTask={addTask}
          projects={projects}
          defaultDueDate={formatDateForInput(selectedDate)}
        />
      )}

      {showNewEventModal && (
        <NewEventModal
          isOpen={showNewEventModal}
          onClose={() => setShowNewEventModal(false)}
          onAddEvent={addSchedule}
          projects={projects}
          defaultDate={formatDateForInput(selectedDate)}
        />
      )}

      {showEditEventModal && selectedEvent && (
        <EditEventModal
          isOpen={showEditEventModal}
          onClose={() => {
            setShowEditEventModal(false);
            setSelectedEvent(null);
          }}
          onUpdateEvent={updateSchedule}
          onDeleteEvent={deleteSchedule}
          event={selectedEvent}
          projects={projects}
        />
      )}

      {showEditWorkSessionModal && selectedWorkSession && (
        <EditWorkSessionModal
          isOpen={showEditWorkSessionModal}
          onClose={() => {
            setShowEditWorkSessionModal(false);
            setSelectedWorkSession(null);
          }}
          onSave={handleWorkSessionSave}
          onDelete={handleWorkSessionDelete}
          event={selectedWorkSession}
          task={selectedWorkSession.taskId ? tasks.find(t => t.id === selectedWorkSession.taskId) : undefined}
        />
      )}

      {showCounselingModal && (
        <CounselingSessionModal
          isOpen={showCounselingModal}
          onClose={() => setShowCounselingModal(false)}
          onAddCounselingSession={async (session, progressNote) => {
            await addSchedule(session);
            await addTask(progressNote);
          }}
          projects={projects}
          defaultDate={selectedDate}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onUpdateTask={handleUpdateTask}
          projects={projects}
        />
      )}

      {/* Features Information Modal */}
      {showFeaturesModal && (
        <div 
          className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowFeaturesModal(false)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="featuresModalTitle"
        >
          <div 
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 id="featuresModalTitle" className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                📅 Calendar Features & Mobile Optimizations
              </h2>
              <button 
                onClick={() => setShowFeaturesModal(false)} 
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 text-slate-700 dark:text-slate-300">
              {/* Key Features Section */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  🚀 Key Features Implemented
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                      1. Prominent Top Action Buttons
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Three main buttons (Task, Event, Counseling) are now centered, larger, and more prominent</li>
                      <li>They span the full width with equal spacing for easy thumb access</li>
                      <li>Clear icons and labels with good contrast</li>
                      <li>A centered "Today" button below them</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                      2. Compact Month View with Colored Dots
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Square month view showing the full month</li>
                      <li>Red dots for tasks/deadlines</li>
                      <li>Green dots for events</li>
                      <li>Visual indicators for today (blue highlight) and selected day (blue ring)</li>
                      <li>Easy navigation with prev/next month buttons</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">
                      3. Day View List Mode
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Shows today by default</li>
                      <li>Switches to any day you select from the month view</li>
                      <li>Organized sections for tasks and events with color-coded headers</li>
                      <li>Clean, touch-friendly cards for each item</li>
                      <li>Quick edit buttons on each item</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2">
                      4. Mobile Detection & Integration
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Automatically detects mobile screens (&lt; 768px width)</li>
                      <li>Seamlessly switches between desktop and mobile views</li>
                      <li>All existing functionality (modals, adding items) works in mobile mode</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-teal-600 dark:text-teal-400 mb-2">
                      5. Enhanced User Experience
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Counseling sessions get special blue highlighting</li>
                      <li>Empty state messaging when no items exist</li>
                      <li>Smooth transitions and proper touch targets</li>
                      <li>Maintains all calendar functionality while being mobile-optimized</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mobile Workflow Section */}
              <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  📱 Mobile Workflow
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm mb-3 font-medium">The mobile view now provides a much more efficient workflow:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Quick actions at the top</strong> for adding items</li>
                    <li><strong>Month overview with dot indicators</strong> to see busy days at a glance</li>
                    <li><strong>Detailed day view below</strong> showing exactly what's happening on the selected day</li>
                  </ul>
                </div>
              </div>

              {/* AI Features Section */}
              <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  🤖 AI Suggestions Features
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>AI analyzes your tasks, deadlines, and schedule</li>
                  <li>Suggests optimal time slots based on priority and energy levels</li>
                  <li>You can approve, deny, or manually adjust suggestions with the "Modify Time" button</li>
                  <li>AI learns from your preferences over time</li>
                  <li>Strict business/personal time separation</li>
                  <li>Automatic cleanup of old suggestions</li>
                  <li>Progress notes only suggested after counseling sessions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCalendarPage;