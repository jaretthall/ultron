import React from 'react';
import CalendarWidget from './CalendarWidget';
import UpcomingEventsWidget from './UpcomingEventsWidget';

const RightSidebarComponent: React.FC = () => {
  return (
    <aside className="w-80 bg-slate-800 p-4 border-l border-slate-700 hidden lg:flex flex-col space-y-6 self-stretch">
      <CalendarWidget />
      <UpcomingEventsWidget />
    </aside>
  );
};

export default RightSidebarComponent;