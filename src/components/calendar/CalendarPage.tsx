import React, { useState } from 'react';
import { Task, TaskStatus } from '../../../types';
import NewTaskModal from '../tasks/NewTaskModal';
import TaskScheduler from './TaskScheduler';
import WorkingHoursManager from './WorkingHoursManager';
import FocusBlockManager from './FocusBlockManager';
import EditTaskModal from '../tasks/EditTaskModal';
import { useAppState } from '../../contexts/AppStateContext';
import { formatDateForInput, isSameDate } from '../../utils/dateUtils';

const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const CalendarPage: React.FC = () => {
  const { state, updateTask } = useAppState();
  const { tasks, projects } = state;

  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 5, 1));
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2025, 5, 6));
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isTaskSchedulerOpen, setIsTaskSchedulerOpen] = useState(false);
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [isFocusBlockManagerOpen, setIsFocusBlockManagerOpen] = useState(false);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const numDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2 border border-slate-700 h-24 min-h-[6rem]"></div>);
    }

    for (let day = 1; day <= numDays; day++) {
      const date = new Date(year, month, day);
      const isSelected = selectedDate && isSameDate(date, selectedDate);
      const tasksOnDate = tasks.filter(task => task.due_date && isSameDate(task.due_date, date));

      cells.push(
        <div
          key={day}
          className={`p-2 border border-slate-700 h-24 min-h-[6rem] cursor-pointer hover:bg-slate-700/70 transition-colors flex flex-col
            ${isSelected ? 'bg-sky-700 ring-2 ring-sky-500' : 'bg-slate-800'}
            ${isSameDate(new Date(), date) && !isSelected ? 'bg-slate-600/50' : ''}
          `}
          onClick={() => setSelectedDate(date)}
          role="button"
          aria-pressed={isSelected ? 'true' : 'false'}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedDate(date);}}
        >
          <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>{day}</span>
          <div className="mt-1 space-y-0.5 overflow-y-auto max-h-16 text-xs">
            {tasksOnDate.slice(0, 2).map(task => (
                 <div key={task.id} className={`p-0.5 rounded-sm text-white truncate ${task.priority === 'urgent' ? 'bg-red-600' : task.priority === 'high' ? 'bg-orange-600' : 'bg-sky-800'}`}>
                    {task.title}
                 </div>
            ))}
            {tasksOnDate.length > 2 && <div className="text-slate-400 text-[10px]">+{tasksOnDate.length - 2} more</div>}
          </div>
        </div>
      );
    }
    return cells;
  };

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  }

  const tasksForSelectedDate = selectedDate ? tasks.filter(task => task.due_date && isSameDate(task.due_date, selectedDate)) : [];

  const handleAddTask = (newTask: Task) => {
    dispatch({type: ActionType.ADD_TASK, payload: newTask});
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
              onClick={() => setIsNewTaskModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
              aria-label="Add New Task"
            >
              <PlusIcon /> <span className="ml-2">Add Task</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 bg-slate-800 p-3 rounded-t-lg">
          <h2 className="text-xl font-semibold">
            {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
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
          {renderCalendarGrid()}
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
          {tasksForSelectedDate.length > 0 ? (
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
          ) : (
            <div className="text-center py-10 text-slate-500">
              <svg className="mx-auto h-10 w-10 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p>No tasks due on this date.</p>
            </div>
          )}
        </div>
      </aside>
      {isNewTaskModalOpen && (
        <NewTaskModal
            isOpen={isNewTaskModalOpen}
            onClose={() => setIsNewTaskModalOpen(false)}
            onAddTask={handleAddTask}
            projects={projects}
            defaultDueDate={formatDateForInput(selectedDate)}
        />
      )}
      
      {isTaskSchedulerOpen && selectedDate && (
        <TaskScheduler
          selectedDate={selectedDate}
          onClose={() => setIsTaskSchedulerOpen(false)}
          onScheduleUpdate={(scheduledTasks) => {
            console.log('Scheduled tasks:', scheduledTasks);
            // TODO: Implement task scheduling persistence
            setIsTaskSchedulerOpen(false);
          }}
        />
      )}

      {isWorkingHoursOpen && (
        <WorkingHoursManager
          onClose={() => setIsWorkingHoursOpen(false)}
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

export default CalendarPage;
