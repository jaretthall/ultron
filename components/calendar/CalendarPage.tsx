import React, { useState } from 'react';
import { Task, Project } from '../../types'; 
import NewTaskModal from '../tasks/NewTaskModal'; 
import { formatDateForInput, isSameDate } from '../../utils/dateUtils';

interface CalendarPageProps {
  tasks: Task[]; 
  onAddTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void; 
  allProjects: Project[]; 
  onEditTaskRequest: (task: Task) => void; // Added for future use
  onDeleteTask: (taskId: string) => void; // Added for future use
}

const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const CalendarPage: React.FC<CalendarPageProps> = ({ tasks, onAddTask, allProjects, onEditTaskRequest, onDeleteTask }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 5, 1)); // June 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2025, 5, 6)); // June 6, 2025
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false); 

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
      cells.push(<div key={`empty-${i}`} className="p-2 border border-slate-700 h-28 min-h-[7rem]"></div>);
    }

    for (let day = 1; day <= numDays; day++) {
      const date = new Date(year, month, day);
      const isSelected = selectedDate && isSameDate(date, selectedDate);
      const tasksOnDate = tasks.filter(task => task.due_date && isSameDate(task.due_date, date));
      
      cells.push(
        <div 
          key={day} 
          className={`p-2 border border-slate-700 h-28 min-h-[7rem] cursor-pointer hover:bg-slate-700/70 transition-colors flex flex-col
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
           <div className="mt-1 space-y-0.5 overflow-y-auto max-h-20 text-xs">
            {tasksOnDate.slice(0, 3).map(task => ( // Show max 3 tasks
                 <div key={task.id} className={`p-0.5 rounded-sm text-white truncate ${task.priority === 'urgent' ? 'bg-red-600/80' : task.priority === 'high' ? 'bg-orange-600/80' : 'bg-sky-800/80'}`}>
                    {task.title}
                 </div>
            ))}
            {tasksOnDate.length > 3 && <div className="text-slate-400 text-[10px] mt-0.5">+{tasksOnDate.length - 3} more</div>}
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

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-hidden bg-slate-900 text-slate-100 flex">
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col mr-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-slate-400 mt-1">Visual calendar view of task due dates.</p>
          </div>
          <button 
            onClick={() => setIsNewTaskModalOpen(true)} 
            className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
          >
            <PlusIcon /> <span className="ml-2">Add Task</span>
          </button>
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
        
        <div className="grid grid-cols-7 text-center font-medium text-slate-400 bg-slate-800" role="rowheader">
          {daysOfWeek.map(day => <div key={day} className="py-2 border-b border-x border-slate-700" role="columnheader">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 flex-1 overflow-y-auto bg-slate-800 rounded-b-lg" role="grid">
          {renderCalendarGrid()}
        </div>
      </div>

      {/* Sidebar for Selected Date */}
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
                <li key={task.id} className="p-3 bg-slate-700 rounded-md">
                  <p className="font-medium text-slate-100">{task.title}</p>
                  <p className="text-xs text-slate-400">{task.priority} - {task.status}</p>
                  {/* Future: Add edit/delete buttons here, calling onEditTaskRequest(task) or onDeleteTask(task.id) */}
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
            onAddTask={(taskData) => onAddTask({...taskData, due_date: formatDateForInput(selectedDate) || undefined })}
            projects={allProjects}
            defaultDueDate={formatDateForInput(selectedDate)} 
        />
      )}
    </div>
  );
};

export default CalendarPage;
