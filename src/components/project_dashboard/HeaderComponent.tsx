import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderComponentProps {
  projectContextFilter: 'all' | 'business' | 'personal';
  onProjectContextFilterChange: (filter: 'all' | 'business' | 'personal') => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ 
  projectContextFilter, 
  onProjectContextFilterChange 
}) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const getLinkClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `px-3 py-2 rounded text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-slate-700 text-white' 
        : 'text-slate-300 hover:text-white hover:bg-slate-700'
    }`;
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">Nexus AI Assistant</h1>
          <nav className="hidden md:flex space-x-1" data-testid="main-navigation">
            <Link to="/" className={getLinkClassName('/')}>Home</Link>
            <Link to="/projects" className={getLinkClassName('/projects')}>Projects</Link>
            <Link to="/tasks" className={getLinkClassName('/tasks')}>Tasks</Link>
            <Link to="/calendar" className={getLinkClassName('/calendar')}>Calendar</Link>
            <Link to="/documents" className={getLinkClassName('/documents')}>Documents</Link>
            <Link to="/ai" className={getLinkClassName('/ai')}>AI</Link>
            <Link to="/analytics" className={getLinkClassName('/analytics')}>Analytics</Link>
            <Link to="/settings" className={getLinkClassName('/settings')}>Settings</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Project Context Filter */}
          <select
            value={projectContextFilter}
            onChange={(e) => onProjectContextFilterChange(e.target.value as 'all' | 'business' | 'personal')}
            className="bg-slate-700 text-white text-sm rounded px-3 py-1 border border-slate-600"
            aria-label="Filter projects by context"
            title="Filter projects by business or personal context"
          >
            <option value="all">All Projects</option>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </select>

          {/* User Menu */}
          <div className="relative" data-testid="user-menu">
            <button
              type="button"
              className="flex items-center space-x-2 text-slate-300 hover:text-white px-3 py-2 rounded"
              data-testid="sign-out-button"
              onClick={async () => {
                try {
                  await signOut();
                } catch (error) {
                  console.error('Sign out failed:', error);
                }
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderComponent; 