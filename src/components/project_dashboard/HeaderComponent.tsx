import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCustomAuth } from '../../contexts/CustomAuthContext';
import { Menu, X } from 'lucide-react';

interface HeaderComponentProps {
  projectContextFilter: 'all' | 'business' | 'personal';
  onProjectContextFilterChange: (filter: 'all' | 'business' | 'personal') => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ 
  projectContextFilter, 
  onProjectContextFilterChange 
}) => {
  const location = useLocation();
  const { signOut } = useCustomAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getLinkClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `px-3 py-2 rounded text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-slate-700 text-white' 
        : 'text-slate-300 hover:text-white hover:bg-slate-700'
    }`;
  };

  const getMobileLinkClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
      isActive 
        ? 'bg-slate-700 text-white' 
        : 'text-slate-300 hover:text-white hover:bg-slate-700'
    }`;
  };

  const navigationItems = [
    { to: '/', label: 'Home' },
    { to: '/projects', label: 'Projects' },
    { to: '/tasks', label: 'Tasks' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/documents', label: 'Documents' },
    { to: '/ai', label: 'AI' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/settings', label: 'Settings' }
  ];

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/Ultron_logo.png" 
                alt="Ultron Logo" 
                className="w-8 h-8 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className="text-xl font-bold text-white">Ultron</h1>
            </div>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1" data-testid="main-navigation">
              {navigationItems.map((item) => (
                <Link key={item.to} to={item.to} className={getLinkClassName(item.to)}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Project Context Filter - Hide on small screens */}
            <select
              value={projectContextFilter}
              onChange={(e) => onProjectContextFilterChange(e.target.value as 'all' | 'business' | 'personal')}
              className="hidden sm:block bg-slate-700 text-white text-sm rounded px-3 py-1 border border-slate-600"
              aria-label="Filter projects by context"
              title="Filter projects by business or personal context"
            >
              <option value="all">All Projects</option>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded="false"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* User Menu - Desktop */}
            <div className="hidden md:block relative" data-testid="user-menu">
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

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={getMobileLinkClassName(item.to)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Project Context Filter */}
              <div className="px-3 py-2">
                <label htmlFor="mobile-project-filter" className="block text-sm font-medium text-slate-300 mb-1">
                  Project Filter
                </label>
                <select
                  id="mobile-project-filter"
                  value={projectContextFilter}
                  onChange={(e) => onProjectContextFilterChange(e.target.value as 'all' | 'business' | 'personal')}
                  className="w-full bg-slate-700 text-white text-sm rounded px-3 py-2 border border-slate-600"
                  aria-label="Filter projects by context"
                >
                  <option value="all">All Projects</option>
                  <option value="business">Business</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              {/* Mobile Sign Out */}
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700 flex items-center space-x-2"
                data-testid="sign-out-button"
                onClick={async () => {
                  try {
                    await signOut();
                    setIsMobileMenuOpen(false);
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
        )}
      </div>
    </header>
  );
};

export default HeaderComponent; 