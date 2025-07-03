import React, { useState, useEffect } from 'react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  mobileMenuTrigger?: React.ReactNode;
}

interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

const breakpoints: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
};

interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const useScreenSize = (): ScreenSize => {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < breakpoints.mobile : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= breakpoints.mobile && window.innerWidth < breakpoints.desktop : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= breakpoints.desktop : true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({
        width,
        height,
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
        isDesktop: width >= breakpoints.desktop,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  sidebar, 
  header,
  // mobileMenuTrigger - unused but kept for future use
}) => {
  const { isMobile, isTablet } = useScreenSize();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      const handleOutsideClick = (event: MouseEvent) => {
        const target = event.target as Element;
        if (!target.closest('.mobile-sidebar') && !target.closest('.mobile-menu-trigger')) {
          setSidebarOpen(false);
        }
      };

      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isMobile, sidebarOpen]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Desktop layout
  if (!isMobile && !isTablet) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {header && (
          <div className="flex-shrink-0">
            {header}
          </div>
        )}
        <div className="flex-1 flex overflow-hidden">
          {sidebar && (
            <div className="flex-shrink-0 w-64 bg-slate-800 border-r border-slate-600 overflow-y-auto">
              {sidebar}
            </div>
          )}
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    );
  }

  // Mobile/Tablet layout
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {header && (
        <div className="flex-shrink-0 relative z-30">
          <div className="flex items-center justify-between p-4">
            {/* Mobile menu trigger */}
            {sidebar && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mobile-menu-trigger p-2 rounded-md text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-white lg:hidden"
                aria-label="Open sidebar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            {header}
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebar && sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          
          {/* Sidebar */}
          <div className="mobile-sidebar fixed inset-y-0 left-0 w-64 bg-slate-800 border-r border-slate-600 z-50 transform transition-transform duration-200 ease-in-out overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-600">
              <h2 className="text-lg font-semibold text-slate-100">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close sidebar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {sidebar}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <main className={`p-4 ${isMobile ? 'pb-safe' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Mobile-first responsive grid system
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 }, 
  gap = 4,
  className = ''
}) => {
  const gridClasses = [
    `grid`,
    `grid-cols-${cols.mobile || 1}`,
    cols.tablet && `md:grid-cols-${cols.tablet}`,
    cols.desktop && `lg:grid-cols-${cols.desktop}`,
    `gap-${gap}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = true,
  className = ''
}) => {
  const containerClasses = [
    'w-full',
    maxWidth !== 'full' && `max-w-${maxWidth}`,
    'mx-auto',
    padding && 'px-4 sm:px-6 lg:px-8',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

// Mobile-optimized card component
interface MobileCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  onClick
}) => {
  const { isMobile } = useScreenSize();
  
  const cardClasses = [
    'bg-slate-800 rounded-lg border border-slate-600',
    isMobile ? 'p-4' : 'p-6',
    onClick && 'cursor-pointer hover:bg-slate-750 transition-colors',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || subtitle || actions) && (
        <div className={`flex items-center justify-between ${children ? 'mb-4' : ''}`}>
          <div>
            {title && (
              <h3 className={`font-semibold text-slate-100 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={`text-slate-400 ${isMobile ? 'text-sm' : 'text-base'}`}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

// Hook to detect screen size (export for use in other components)
export { useScreenSize };

export default ResponsiveLayout; 