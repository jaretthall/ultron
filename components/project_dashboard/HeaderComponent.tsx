import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppState } from '../../src/contexts/AppStateContext';
import NotificationCenter from '../../src/components/NotificationCenter';
import ProjectSharingModal from '../../src/components/collaboration/ProjectSharingModal';
import ExportSharingModal from '../../src/components/collaboration/ExportSharingModal';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  );
};

const UserControl: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void, to?: string, ariaLabel?: string }> = ({ children, className, onClick, to, ariaLabel }) => {
  if (to) {
    return (
      <Link
        to={to}
        className={`p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white ${className}`}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};


interface HeaderComponentProps {
  projectContextFilter?: 'all' | 'business' | 'personal';
  onProjectContextFilterChange?: (filter: 'all' | 'business' | 'personal') => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({
  projectContextFilter = 'all',
  onProjectContextFilterChange
}) => {
  const location = useLocation();
  const { state } = useAppState();
  const { tasks, projects } = state;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProjectSharing, setShowProjectSharing] = useState(false);
  const [showExportSharing, setShowExportSharing] = useState(false);
  const [showContextDropdown, setShowContextDropdown] = useState(false);
  const showProjectSpecificControls = location.pathname === '/projects';
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowContextDropdown(false);
      }
    };

    if (showContextDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextDropdown]);

  // Calculate notification count
  const getNotificationCount = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    let count = 0;
    
    // Count overdue and due soon tasks
    tasks.forEach(task => {
      if (task.due_date && task.status !== 'completed') {
        const dueDate = new Date(task.due_date);
        if (dueDate < sevenDaysFromNow) {
          count++;
        }
      }
    });
    
    // Count project deadlines
    projects.forEach(project => {
      if (project.deadline && project.status !== 'completed') {
        const deadline = new Date(project.deadline);
        if (deadline < sevenDaysFromNow) {
          count++;
        }
      }
    });
    
    // Count urgent tasks without deadlines
    const urgentTasksWithoutDeadlines = tasks.filter(task => 
      task.priority === 'urgent' && 
      task.status !== 'completed' && 
      !task.due_date
    );
    count += urgentTasksWithoutDeadlines.length;
    
    return count;
  };

  const notificationCount = getNotificationCount();

  return (
    <header className="bg-slate-900 shadow-md shrink-0" role="banner">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex items-center px-2 lg:px-0">
            <div className="flex-shrink-0">
              <Link to="/" aria-label="Ultron Home">
                <img 
                  className="h-10 w-10 rounded-md object-contain" 
                  src="/Ultron_logo.jpeg" 
                  alt="Ultron Logo"
                  onError={(e) => {
                    // Fallback to the old logo if new one doesn't load
                    e.currentTarget.src = "/assets/logo.png";
                  }}
                />
              </Link>
            </div>
            <div className="hidden lg:block lg:ml-4">
              <nav className="flex items-baseline space-x-1" role="navigation" aria-label="Main navigation">
                 <h1 className="text-xl font-semibold text-slate-50 ml-2 mr-4">Ultron</h1>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/projects">Projects</NavLink>
                <NavLink to="/tasks">Tasks</NavLink>
                <NavLink to="/calendar">Calendar</NavLink>
                <NavLink to="/documents">Documents</NavLink>
                <NavLink to="/ai">AI Dashboard</NavLink>
                <NavLink to="/analytics">Analytics</NavLink>
                <NavLink to="/settings">Settings</NavLink>
              </nav>
            </div>
          </div>
          
          <div className="flex items-center space-x-2" role="toolbar" aria-label="User actions">
            {/* Global Search Button */}
            <button 
              type="button"
              onClick={() => {
                // Trigger the global search - this will be handled by the AppWithAuth component
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
                window.dispatchEvent(event);
              }}
              className="flex items-center bg-slate-800/50 text-slate-300 px-3 py-1.5 rounded-md text-sm hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 transition-all"
              title="Search (Ctrl+K)"
              aria-label="Open global search"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
              <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-slate-700 text-slate-300 rounded border border-slate-600">⌘K</kbd>
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                title="Notifications"
                aria-label={`Notifications ${notificationCount > 0 ? `(${notificationCount} new)` : ''}`}
                aria-haspopup="true"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10a3 3 0 116 0v3.464a1.5 1.5 0 01-.5 1.122L12 17l-2.5-2.414a1.5 1.5 0 01-.5-1.122V10z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21h6" />
                 </svg>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px]" aria-label={`${notificationCount} notifications`}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              <NotificationCenter 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
              />

              {/* Project Sharing Modal */}
              <ProjectSharingModal
                isOpen={showProjectSharing}
                onClose={() => setShowProjectSharing(false)}
                project={showProjectSpecificControls && projects.length > 0 ? projects[0] : null}
              />

              {/* Export Sharing Modal */}
              <ExportSharingModal
                isOpen={showExportSharing}
                onClose={() => setShowExportSharing(false)}
                exportData={showProjectSpecificControls && projects.length > 0 ? {
                  type: 'workspace',
                  title: `${projects[0].title} Export`,
                  data: projects[0],
                  generatedAt: new Date()
                } : null}
              />
            </div>

            {showProjectSpecificControls && (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    type="button" 
                    onClick={() => setShowContextDropdown(!showContextDropdown)}
                    className="flex items-center bg-slate-800 text-slate-200 px-3 py-1.5 rounded-md text-sm hover:bg-slate-700" 
                    aria-label="Project context filter"
                    aria-haspopup="true"
                    {...(showContextDropdown ? { 'aria-expanded': 'true' } : { 'aria-expanded': 'false' })}
                  >
                    {projectContextFilter === 'all' ? 'All Projects' : 
                     projectContextFilter === 'business' ? 'Business' : 'Personal'}
                    <svg className="ml-1 h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {showContextDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg border border-slate-700 z-50">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                          onClick={() => {
                            onProjectContextFilterChange?.('all');
                            setShowContextDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${
                            projectContextFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-300'
                          }`}
                          role="menuitem"
                        >
                          All Projects
                        </button>
                        <button
                          onClick={() => {
                            onProjectContextFilterChange?.('business');
                            setShowContextDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${
                            projectContextFilter === 'business' ? 'bg-slate-700 text-white' : 'text-slate-300'
                          }`}
                          role="menuitem"
                        >
                          Business
                        </button>
                        <button
                          onClick={() => {
                            onProjectContextFilterChange?.('personal');
                            setShowContextDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${
                            projectContextFilter === 'personal' ? 'bg-slate-700 text-white' : 'text-slate-300'
                          }`}
                          role="menuitem"
                        >
                          Personal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <UserControl className="bg-green-500/20 text-green-400 hover:bg-green-500/30" ariaLabel="Mark project as complete">Complete</UserControl>
                <UserControl ariaLabel="Share project" onClick={() => setShowProjectSharing(true)}>Share</UserControl>
                <UserControl ariaLabel="Export project data" onClick={() => setShowExportSharing(true)}>Export</UserControl>
              </>
            )}
             <UserControl to="/settings" ariaLabel="Open settings">
              <span className="sr-only">Settings</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </UserControl>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderComponent;
