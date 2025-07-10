import React, { useState, useMemo, useCallback } from 'react';
import { Task, Schedule, TaskPriority, TaskStatus } from '../../../types';
import { useAppState } from '../../contexts/AppStateContext';
import { formatDateForInput, isSameDate } from '../../utils/dateUtils';
import NewTaskModal from '../tasks/NewTaskModal';
import NewEventModal from './NewEventModal';
import EditEventModal from './EditEventModal';
import TaskScheduler from './TaskScheduler';
import WorkingHoursManager from './WorkingHoursManager';
import FocusBlockManager from './FocusBlockManager';
// import EditTaskModal from '../tasks/EditTaskModal';

const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

interface CalendarPageProps {
  onTaskClick?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ onTaskClick, onEditTask }) => {
  const { state, /*updateTask,*/ addTask, addSchedule, updateSchedule, deleteSchedule } = useAppState();
  const { tasks, projects, schedules } = state;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);
  const [isTaskSchedulerOpen, setIsTaskSchedulerOpen] = useState(false);
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [isFocusBlockManagerOpen, setIsFocusBlockManagerOpen] = useState(false);

  // Memoize static data
  const daysOfWeek = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);

  // Memoize calendar calculations
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    return { year, month, numDays, firstDay };
  }, [currentDate]);

  // Memoize filtered tasks and events for selected date
  const selectedDateData = useMemo(() => {
    if (!selectedDate) return { tasks: [], events: [] };
    
    const tasksForDate = tasks.filter(task => 
      task.due_date && isSameDate(task.due_date, selectedDate)
    );
    
    const eventsForDate = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start_date);
      return isSameDate(scheduleDate, selectedDate);
    });
    
    return { tasks: tasksForDate, events: eventsForDate };
  }, [selectedDate, tasks, schedules]);

  // Memoize calendar grid rendering
  const calendarGrid = useMemo(() => {
    const { year, month, numDays, firstDay } = calendarData;
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2 border border-slate-700 h-24 min-h-[6rem]"></div>);
    }

    for (let day = 1; day <= numDays; day++) {
      const date = new Date(year, month, day);
      const isSelected = selectedDate && isSameDate(date, selectedDate);
      const tasksOnDate = tasks.filter(task => task.due_date && isSameDate(task.due_date, date));
      const eventsOnDate = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.start_date);
        return isSameDate(scheduleDate, date);
      });

      cells.push(
        <div
          key={day}
          className={`p-2 border border-slate-700 h-24 min-h-[6rem] cursor-pointer hover:bg-slate-700/70 transition-colors flex flex-col
            ${isSelected ? 'bg-sky-700 ring-2 ring-sky-500' : 'bg-slate-800'}
            ${isSameDate(new Date(), date) && !isSelected ? 'bg-slate-600/50' : ''}
          `}
          onClick={() => setSelectedDate(date)}
          role="button"
          aria-pressed={isSelected ? "true" : "false"}
          aria-label={`Select ${date.toLocaleDateString()}, ${tasksOnDate.length} tasks, ${eventsOnDate.length} events`}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedDate(date);}}
        >
          <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>{day}</span>
          <div className="mt-1 space-y-0.5 overflow-y-auto max-h-16 text-xs">
            {tasksOnDate.slice(0, 1).map(task => (
                 <div key={task.id} className={`p-0.5 rounded-sm text-white truncate ${task.priority === 'urgent' ? 'bg-red-600' : task.priority === 'high' ? 'bg-orange-600' : 'bg-sky-800'}`}>
                    {task.title}
                 </div>
            ))}
            {eventsOnDate.slice(0, 1).map(event => (
                 <div key={event.id} className="p-0.5 rounded-sm text-white truncate bg-green-600">
                    {event.title}
                 </div>
            ))}
            {(tasksOnDate.length + eventsOnDate.length) > 2 && <div className="text-slate-400 text-[10px]">+{(tasksOnDate.length + eventsOnDate.length) - 2} more</div>}
          </div>
        </div>
      );
    }
    return cells;
  }, [calendarData, tasks, schedules, selectedDate]);

  // Memoize navigation functions
  const prevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);
  
  const nextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);
  
  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  }, []);

  // Use memoized data instead of re-filtering
  const { tasks: tasksForSelectedDate, events: eventsForSelectedDate } = selectedDateData;

  // Memoize event handlers to prevent re-renders
  const handleTaskClick = useCallback(onTaskClick || ((task: Task) => {
    console.log('Task clicked:', task.title);
  }), [onTaskClick]);

  const handleEditTask = useCallback(onEditTask || ((task: Task) => {
    console.log('Edit task:', task.title);
  }), [onEditTask]);

  const handleMarkComplete = (task: Task) => {
    console.log('Mark complete:', task.title);
    // updateTask({ ...task, status: 'completed' });
  };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await addTask(taskData);
      setShowNewTaskModal(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleAddEvent = async (eventData: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Adding event:', eventData);
      await addSchedule(eventData);
      setShowNewEventModal(false);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleEditEvent = (event: Schedule) => {
    setSelectedEvent(event);
    setShowEditEventModal(true);
  };

  const handleUpdateEvent = async (id: string, updates: Partial<Schedule>) => {
    try {
      await updateSchedule(id, updates);
      setShowEditEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteSchedule(id);
      setShowEditEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const handleAddCounselingSession = async () => {
    if (!selectedDate) {
      alert('Please select a date first');
      return;
    }

    try {
      // Create a default 1-hour counseling session
      const now = new Date();
      const startTime = '10:00'; // Default 10 AM start time
      const endTime = '11:00';   // 1 hour session
      
      const counselingSession = {
        title: 'Counseling Session',
        context: 'Individual therapy session',
        start_date: `${formatDateForInput(selectedDate)}T${startTime}`,
        end_date: `${formatDateForInput(selectedDate)}T${endTime}`,
        all_day: false,
        event_type: 'appointment' as const,
        location: 'Office',
        blocks_work_time: true,
        tags: ['therapy', 'counseling'],
      };

      // Add the counseling session
      const createdEvent = await addSchedule(counselingSession);
      console.log('✅ Counseling session created:', createdEvent);

      // Automatically create a progress note task
      const progressNoteTask = {
        title: `Progress Note - ${formatDateForInput(selectedDate)}`,
        context: 'Write therapy progress note for counseling session conducted today. Include client progress, session goals, interventions used, and next steps.',
        priority: TaskPriority.MEDIUM,
        estimated_hours: 0.5,
        status: TaskStatus.TODO,
        due_date: formatDateForInput(selectedDate),
        tags: ['progress-note', 'therapy', 'documentation'],
        dependencies: [],
        energy_level: 'low' as const,
      };

      await addTask(progressNoteTask);
      console.log('✅ Progress note task created automatically');

      // Show success message
      alert('✅ Counseling session and progress note task created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating counseling session:', error);
      alert('❌ Failed to create counseling session. Please try again.');
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-hidden bg-slate-900 text-slate-100 flex">
      <div className="flex-1 flex flex-col mr-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-slate-400 mt-1">Visual calendar view of task due dates and intelligent scheduling.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsWorkingHoursOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
              title="Configure Working Hours"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Working Hours
            </button>
            <button
              onClick={() => selectedDate && setIsTaskSchedulerOpen(true)}
              disabled={!selectedDate}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
              title="Schedule Tasks for Selected Date"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Schedule Tasks
            </button>
            <button
              onClick={() => setIsFocusBlockManagerOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
              title="Manage Focus Blocks"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Focus Blocks
            </button>
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
              aria-label="Add New Task"
            >
              <PlusIcon /> <span className="ml-2">Add Task</span>
            </button>
            <button
              onClick={() => setShowNewEventModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
              aria-label="Add New Event"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Add Event</span>
            </button>
            <button
              onClick={() => handleAddCounselingSession()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
              aria-label="Add Counseling Session"
              title="Quick add 1-hour counseling session with automatic progress note task"
            >
              <PlusIcon />
              <span className="ml-2">Counseling</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 bg-slate-800 p-3 rounded-t-lg">
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-2">
            <button onClick={prevMonth} className="p-2 rounded-md hover:bg-slate-700" aria-label="Previous month">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={nextMonth} className="p-2 rounded-md hover:bg-slate-700" aria-label="Next month">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center font-medium text-slate-400 bg-slate-800">
          {daysOfWeek.map(day => <div key={day} className="py-2 border-b border-x border-slate-700">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 flex-1 overflow-y-auto bg-slate-800 rounded-b-lg">
          {calendarGrid}
        </div>
      </div>

      <aside className="w-72 bg-slate-800 p-4 rounded-lg flex flex-col shrink-0">
        <button
          onClick={goToToday}
          className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2 px-4 rounded-lg text-sm mb-4"
        >
          Today
        </button>
        <h3 className="text-lg font-semibold mb-1">
          {selectedDate ? selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' }) : 'No date selected'}
        </h3>
        <div className="flex-1 overflow-y-auto pt-2" aria-live="polite">
          {tasksForSelectedDate.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Tasks</h4>
              <ul className="space-y-3">
                {tasksForSelectedDate.map(task => (
                  <li 
                    key={task.id} 
                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-md cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg group"
                    onClick={() => handleTaskClick(task)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTaskClick(task);
                      }
                    }}
                    aria-label={`Edit task: ${task.title}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-slate-100 group-hover:text-sky-400 transition-colors">{task.title}</p>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                          className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-600"
                          aria-label={`Edit ${task.title}`}
                          title="Edit task"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMarkComplete(task); }}
                          className={`p-1 rounded text-slate-400 hover:text-green-400 hover:bg-slate-600 ${task.status === 'completed' ? 'text-green-400' : ''}`}
                          aria-label={`Mark ${task.title} as ${task.status === 'completed' ? 'incomplete' : 'complete'}`}
                          title={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{task.priority} - {task.status}</p>
                    <p className="text-[10px] text-slate-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to edit or use buttons</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {eventsForSelectedDate.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Events</h4>
              <ul className="space-y-3">
                {eventsForSelectedDate.map(event => (
                  <li 
                    key={event.id} 
                    className="p-3 bg-green-700 hover:bg-green-600 rounded-md cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg group"
                    onClick={() => handleEditEvent(event)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleEditEvent(event);
                      }
                    }}
                    aria-label={`Edit event: ${event.title}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-slate-100 group-hover:text-green-200 transition-colors">{event.title}</p>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                          className="p-1 rounded text-slate-200 hover:text-green-200 hover:bg-green-600"
                          aria-label={`Edit ${event.title}`}
                          title="Edit event"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedEvent(event);
                            setShowEditEventModal(true);
                          }}
                          className="p-1 rounded text-slate-200 hover:text-red-300 hover:bg-red-600"
                          aria-label={`Delete ${event.title}`}
                          title="Delete event"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-200">
                      {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(event.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {event.context && <p className="text-xs text-slate-300 mt-1">{event.context}</p>}
                    <p className="text-[10px] text-slate-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to edit or use buttons</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {tasksForSelectedDate.length === 0 && eventsForSelectedDate.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <svg className="mx-auto h-10 w-10 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p>No tasks or events on this date.</p>
            </div>
          )}
        </div>
      </aside>
      {showNewTaskModal && (
        <NewTaskModal
            isOpen={showNewTaskModal}
            onClose={() => setShowNewTaskModal(false)}
            onAddTask={handleAddTask}
            projects={projects}
            defaultDueDate={formatDateForInput(selectedDate)}
        />
      )}
      
      {showNewEventModal && (
        <NewEventModal
          isOpen={showNewEventModal}
          onClose={() => setShowNewEventModal(false)}
          onAddEvent={handleAddEvent}
          projects={projects}
          defaultDate={selectedDate ? formatDateForInput(selectedDate) : undefined}
        />
      )}
      
      {showEditEventModal && (
        <EditEventModal
          isOpen={showEditEventModal}
          onClose={() => {
            setShowEditEventModal(false);
            setSelectedEvent(null);
          }}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          event={selectedEvent}
          projects={projects}
        />
      )}
      
      {isTaskSchedulerOpen && (
        <TaskScheduler
          task={selectedDate ? tasks.find(task => isSameDate(task.due_date, selectedDate)) || tasks[0] : tasks[0]}
          selectedDate={selectedDate || new Date()}
          onClose={() => setIsTaskSchedulerOpen(false)}
          onScheduleUpdate={(scheduledTask: Task) => {
            console.log('Task scheduled:', scheduledTask);
            setIsTaskSchedulerOpen(false);
          }}
        />
      )}

      {isWorkingHoursOpen && (
        <WorkingHoursManager
          userPreferences={state.userPreferences!}
          onUpdate={(updatedPreferences) => {
            console.log('Updated preferences:', updatedPreferences);
            setIsWorkingHoursOpen(false);
          }}
        />
      )}

      {isFocusBlockManagerOpen && (
        <FocusBlockManager
          onClose={() => setIsFocusBlockManagerOpen(false)}
        />
      )}
    </div>
  );
};

// Memoize CalendarPage for performance optimization
export default React.memo(CalendarPage, (prevProps, nextProps) => {
  // Optimize re-renders by checking specific properties
  return (
    prevProps.onTaskClick === nextProps.onTaskClick &&
    prevProps.onEditTask === nextProps.onEditTask
  );
});
