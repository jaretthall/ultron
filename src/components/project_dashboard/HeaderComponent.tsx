import React from 'react';

interface HeaderComponentProps {
  projectContextFilter: 'all' | 'business' | 'personal';
  onProjectContextFilterChange: (filter: 'all' | 'business' | 'personal') => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ 
  projectContextFilter, 
  onProjectContextFilterChange 
}) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">Ultron</h1>
          <nav className="hidden md:flex space-x-4">
            <a href="/" className="text-slate-300 hover:text-white">Dashboard</a>
            <a href="/projects" className="text-slate-300 hover:text-white">Projects</a>
            <a href="/tasks" className="text-slate-300 hover:text-white">Tasks</a>
            <a href="/calendar" className="text-slate-300 hover:text-white">Calendar</a>
            <a href="/ai" className="text-slate-300 hover:text-white">AI</a>
            <a href="/analytics" className="text-slate-300 hover:text-white">Analytics</a>
            <a href="/settings" className="text-slate-300 hover:text-white">Settings</a>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Project Context Filter */}
          <select
            value={projectContextFilter}
            onChange={(e) => onProjectContextFilterChange(e.target.value as 'all' | 'business' | 'personal')}
            className="bg-slate-700 text-white text-sm rounded px-3 py-1 border border-slate-600"
          >
            <option value="all">All Projects</option>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default HeaderComponent; 