import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, Schedule } from '../../../types';
import { useAppState } from '../../contexts/AppStateContext';
import { calendarIntegrationService, CalendarEvent, AIScheduleSuggestion } from '../../services/calendarIntegrationService';
import { formatDateForInput } from '../../utils/dateUtils';

// Import existing modals
import NewTaskModal from '../tasks/NewTaskModal';
import EditTaskModal from '../tasks/EditTaskModal';
import NewEventModal from './NewEventModal';
import EditEventModal from './EditEventModal';
import CounselingSessionModal from './CounselingSessionModal';

// Import view components (we'll create these)
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
// import DayView from './views/DayView';
import AISuggestionsPanel from './views/AISuggestionsPanel';
import DayDetailsSidebar from './DayDetailsSidebar';

// Icons
const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25m3 2.25H3.75m16.5 0v11.25A2.25 2.25 0 0119.5 21H4.5a2.25 2.25 0 01-2.25-2.25V8.25m16.5 0V6a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 6v2.25" />
  </svg>
);

const WeekIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

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

export type CalendarViewType = 'month' | 'week';

interface EnhancedCalendarPageProps {
  onTaskClick?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
}

const EnhancedCalendarPage: React.FC<EnhancedCalendarPageProps> = ({ onTaskClick }) => {
  const { state, addTask, updateTask, addSchedule, updateSchedule, deleteSchedule } = useAppState();
  const { tasks, projects, schedules } = state;

  // State for calendar navigation and view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  
  // Calendar data state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<AIScheduleSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showDayDetails, setShowDayDetails] = useState(false);

  // Modal states
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showCounselingModal, setShowCounselingModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);
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
      
      case 'week':
        // Start of week (Sunday) to end of week (Saturday)
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        endDate.setDate(startDate.getDate() + 6);
        break;
      
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
    
    switch (viewType) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
    }
    
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    
    switch (viewType) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
    }
    
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
    }
  }, [schedules, tasks, onTaskClick]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowDayDetails(true); // Show day details sidebar when date is selected
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

  const handleAISuggestionDeny = async (suggestionId: string) => {
    try {
      await calendarIntegrationService.denySuggestion(suggestionId);
      setAISuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error denying AI suggestion:', error);
    }
  };

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
      } else if (event.source === 'task' && event.taskId) {
        const task = tasks.find(t => t.id === event.taskId);
        if (task) {
          // Check if this is a deadline event or work session event
          if (event.type === 'deadline') {
            // Update due_date for deadline events
            await updateTask(event.taskId, {
              due_date: newStart.toISOString().split('T')[0]
            });
          } else if (event.type === 'work_session') {
            // Update work session schedule for work session events
            await updateTask(event.taskId, {
              work_session_scheduled_start: newStart.toISOString(),
              work_session_scheduled_end: newEnd.toISOString()
            });
          }
          await loadCalendarData(); // Reload calendar data to reflect changes
        }
      }
    } catch (error) {
      console.error('Error updating event position:', error);
    }
  };

  // Format date for display
  const formatDateRange = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric' 
    };
    
    switch (viewType) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', options);
      
      case 'week':
        const weekStart = new Date(currentDate);
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString('en-US', { month: 'long' })} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        } else {
          return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${weekStart.getFullYear()}`;
        }
      
      // Day view removed - no longer needed
      
      default:
        return '';
    }
  }, [currentDate, viewType]);

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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title and Date Range */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
            <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {formatDateRange}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={navigatePrevious}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={navigateToday}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Today
              </button>
              
              <button
                onClick={navigateNext}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label="Next"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* View Type Selector */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              {(['month', 'week'] as CalendarViewType[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setViewType(view)}
                  className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                    viewType === view
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {view === 'month' && <CalendarIcon className="w-4 h-4" />}
                  {view === 'week' && <WeekIcon className="w-4 h-4" />}
                  {!isMobile && <span className="capitalize">{view}</span>}
                </button>
              ))}
            </div>

            {/* AI Suggestions Button */}
            {pendingSuggestions > 0 && (
              <button
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className="relative px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <SparklesIcon className="w-4 h-4" />
                {!isMobile && <span>AI Suggestions</span>}
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingSuggestions}
                </span>
              </button>
            )}

            {/* Day Details Toggle */}
            <button
              onClick={() => setShowDayDetails(!showDayDetails)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showDayDetails 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {!isMobile && <span>Day Details</span>}
            </button>

            {/* Add Button */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                {!isMobile && <span>Task</span>}
              </button>
              
              <button
                onClick={() => setShowNewEventModal(true)}
                className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                {!isMobile && <span>Event</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Calendar View */}
        <div className="flex-1 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!isLoading && (
            <>
              {viewType === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  events={filteredEvents}
                  onDateSelect={handleDateSelect}
                  onEventClick={handleEventClick}
                  onEventDrop={handleEventDrop}
                />
              )}

              {viewType === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  events={filteredEvents}
                  onDateSelect={handleDateSelect}
                  onEventClick={handleEventClick}
                  onEventDrop={handleEventDrop}
                />
              )}
            </>
          )}
        </div>

        {/* Day Details Sidebar */}
        {showDayDetails && (
          <DayDetailsSidebar
            selectedDate={selectedDate}
            events={calendarEvents}
            suggestions={aiSuggestions}
            onEventClick={handleEventClick}
            onTaskClick={onTaskClick}
            onSuggestionApprove={handleAISuggestionApprove}
            onSuggestionDeny={handleAISuggestionDeny}
            onClose={() => setShowDayDetails(false)}
          />
        )}

        {/* AI Suggestions Sidebar */}
        {showAISuggestions && !showDayDetails && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-auto">
            <AISuggestionsPanel
              suggestions={aiSuggestions}
              onApprove={handleAISuggestionApprove}
              onApproveAll={handleAISuggestionApproveAll}
              onApproveAndEdit={handleAISuggestionApproveAndEdit}
              onProvideFeedback={handleAISuggestionProvideFeedback}
              onDeny={handleAISuggestionDeny}
              onClose={() => setShowAISuggestions(false)}
            />
          </div>
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
    </div>
  );
};

export default EnhancedCalendarPage;