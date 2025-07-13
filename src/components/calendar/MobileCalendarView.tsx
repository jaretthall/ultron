import React, { useState, useMemo, useCallback } from 'react';
import { Task, Schedule } from '../../../types';
import { isSameDate } from '../../utils/dateUtils';

interface MobileCalendarViewProps {
  tasks: Task[];
  schedules: Schedule[];
  projects: any[];
  onAddTask: () => void;
  onAddEvent: () => void;
  onAddCounseling: () => void;
  onTaskClick: (task: Task) => void;
  onEventClick: (event: Schedule) => void;
  onEditTask: (task: Task) => void;
  onEditEvent: (event: Schedule) => void;
  currentDate: Date;
  onCurrentDateChange: (date: Date) => void;
}

const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({
  tasks,
  schedules,
  projects,
  onAddTask,
  onAddEvent,
  onAddCounseling,
  onTaskClick,
  onEventClick,
  onEditTask,
  onEditEvent,
  currentDate,
  onCurrentDateChange
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');

  // Helper function to detect counseling sessions
  const isCounselingSession = useCallback((event: Schedule) => {
    return event.tags?.includes('counseling') || event.tags?.includes('therapy') || 
           event.title.toLowerCase().includes('counseling') || 
           event.title.toLowerCase().includes('therapy');
  }, []);

  // Navigation functions
  const prevMonth = useCallback(() => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onCurrentDateChange(newDate);
  }, [currentDate, onCurrentDateChange]);

  const nextMonth = useCallback(() => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onCurrentDateChange(newDate);
  }, [currentDate, onCurrentDateChange]);

  const goToToday = useCallback(() => {
    const today = new Date();
    onCurrentDateChange(today);
    setSelectedDate(today);
  }, [onCurrentDateChange]);

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  }, [currentDate]);

  // Get events and tasks for a specific date
  const getItemsForDate = useCallback((date: Date) => {
    const dayTasks = tasks.filter(task => 
      task.due_date && isSameDate(new Date(task.due_date), date)
    );
    
    const dayEvents = schedules.filter(event => 
      isSameDate(new Date(event.start_date), date)
    );
    
    return { tasks: dayTasks, events: dayEvents };
  }, [tasks, schedules]);

  // Get tasks and events for selected date
  const selectedDateItems = useMemo(() => {
    return getItemsForDate(selectedDate);
  }, [selectedDate, getItemsForDate]);

  // Generate dots for calendar dates
  const getDateDots = useCallback((date: Date) => {
    const { tasks: dayTasks, events: dayEvents } = getItemsForDate(date);
    const dots = [];
    
    // Red dots for tasks (deadlines)
    if (dayTasks.length > 0) {
      dots.push(
        <div 
          key="tasks" 
          className="w-1.5 h-1.5 bg-red-500 rounded-full" 
          title={`${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}`}
        />
      );
    }
    
    // Green dots for events
    if (dayEvents.length > 0) {
      dots.push(
        <div 
          key="events" 
          className="w-1.5 h-1.5 bg-green-500 rounded-full" 
          title={`${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}`}
        />
      );
    }
    
    return dots;
  }, [getItemsForDate]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  }, []);

  const isToday = useCallback((date: Date) => {
    return isSameDate(date, new Date());
  }, []);

  const isSelected = useCallback((date: Date) => {
    return isSameDate(date, selectedDate);
  }, [selectedDate]);

  const isCurrentMonth = useCallback((date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Top Action Buttons - Centered and Prominent */}
      <div className="p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={onAddTask}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Task
          </button>
          <button
            onClick={onAddEvent}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Event
          </button>
          <button
            onClick={onAddCounseling}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Counseling
          </button>
        </div>
        
        {/* Today Button */}
        <div className="flex justify-center">
          <button
            onClick={goToToday}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2 px-6 rounded-lg text-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* Compact Month View */}
      <div className="bg-slate-800 border-b border-slate-700">
        {/* Month Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="text-lg font-semibold">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={prevMonth} 
              className="p-2 rounded-md hover:bg-slate-700 text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={nextMonth} 
              className="p-2 rounded-md hover:bg-slate-700 text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400 border-b border-slate-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-700 p-1">
          {calendarDays.map((date, index) => {
            const dots = getDateDots(date);
            const isCurrentMonthDate = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            const isSelectedDate = isSelected(date);
            
            return (
              <button
                key={index}
                onClick={() => handleDateSelect(date)}
                className={`
                  aspect-square bg-slate-800 hover:bg-slate-700 flex flex-col items-center justify-center p-1 text-sm transition-colors
                  ${!isCurrentMonthDate ? 'text-slate-500' : 'text-slate-200'}
                  ${isTodayDate ? 'bg-blue-600 text-white' : ''}
                  ${isSelectedDate ? 'ring-2 ring-sky-400' : ''}
                `}
              >
                <span className={`${isTodayDate ? 'font-bold' : ''}`}>
                  {date.getDate()}
                </span>
                {dots.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {dots}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day View List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {selectedDate.toLocaleDateString('default', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <button
            onClick={() => setViewMode(viewMode === 'month' ? 'day' : 'month')}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            {viewMode === 'month' ? 'Day View' : 'Month View'}
          </button>
        </div>

        {/* Tasks Section */}
        {selectedDateItems.tasks.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Tasks ({selectedDateItems.tasks.length})
            </h4>
            <div className="space-y-2">
              {selectedDateItems.tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-slate-100">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Section */}
        {selectedDateItems.events.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Events ({selectedDateItems.events.length})
            </h4>
            <div className="space-y-2">
              {selectedDateItems.events.map(event => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`rounded-lg p-3 cursor-pointer transition-colors ${
                    isCounselingSession(event) 
                      ? 'bg-blue-800 hover:bg-blue-700' 
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-slate-100">{event.title}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {new Date(event.start_date).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} - {new Date(event.end_date).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {event.context && (
                        <p className="text-sm text-slate-400 mt-1">{event.context}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(event);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedDateItems.tasks.length === 0 && selectedDateItems.events.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-lg font-medium">No tasks or events</p>
            <p className="text-sm mt-1">Tap the buttons above to add something!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCalendarView;