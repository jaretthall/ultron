
import React, { useState, useEffect } from 'react';

interface EventItem {
  time: string;
  title: string;
  color: string;
}

const UpcomingEventsWidget: React.FC = () => {
  // Initialize with an empty array, data will be fetched or passed via props later
  const [events, setEvents] = useState<EventItem[]>([]); 

  // useEffect(() => {
  //   // Placeholder for fetching events data in the future
  //   // e.g., fetchUpcomingEvents().then(setEvents);
  // }, []);

  return (
    <div className="bg-slate-800_ p-1 rounded-lg">
      <h3 className="text-sm font-semibold text-white mb-3 px-2">Upcoming</h3>
      {events.length > 0 ? (
        <ul className="space-y-3">
          {events.map((event, index) => (
            <li key={index} className="flex items-start p-2 hover:bg-slate-700 rounded-md cursor-pointer">
              <div className={`w-1.5 h-1.5 rounded-full ${event.color} mt-1.5 mr-3 flex-shrink-0`}></div>
              <div>
                <p className="text-xs text-slate-400">{event.time}</p>
                <p className="text-sm text-slate-100 font-medium">{event.title}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 text-xs text-slate-400">No upcoming events.</p>
      )}
    </div>
  );
};

export default UpcomingEventsWidget;
