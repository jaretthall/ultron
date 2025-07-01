import React from 'react';

const CalendarWidget: React.FC = () => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  // Static dates for June 2025 (starts on Sunday)
  const dates = Array(30).fill(null).map((_, i) => i + 1);
  const emptyStartCells = Array(0).fill(null); // June 1st 2025 is a Sunday
  const calendarCells = [...emptyStartCells, ...dates];

  return (
    <div className="bg-slate-800 p-1 rounded-lg">
      <div className="flex items-center justify-between mb-3 px-2">
        <h3 className="text-sm font-semibold text-white">June 2025</h3>
        <div className="flex space-x-1">
          <button className="p-1 text-slate-400 hover:text-white" aria-label="Previous month">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="p-1 text-slate-400 hover:text-white" aria-label="Next month">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px text-xs text-center">
        {days.map((day, index) => (
          <div key={`day-${index}-${day}`} className="pb-1 text-slate-400 font-medium">{day}</div>
        ))}
        {calendarCells.map((date, index) => (
          <div
            key={index}
            className={`p-1.5 rounded
              ${date === null ? '' : 'hover:bg-slate-700 cursor-pointer'}
              ${date === 5 ? 'bg-sky-600 text-white font-semibold' : date ? 'text-slate-300' : ''}
            `}
          >
            {date}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarWidget;