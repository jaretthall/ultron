import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string; // Tailwind color class e.g., 'text-sky-400'
  href?: string; // Optional link destination
  onClick?: () => void; // Optional click handler
  isLoading?: boolean; // Loading state
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'text-sky-400', 
  href, 
  onClick, 
  isLoading = false 
}) => {
  const cardContent = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-400 uppercase tracking-wider" id={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>
          {title}
        </p>
        <p 
          className="text-3xl font-semibold text-slate-100 mt-1" 
          aria-labelledby={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}
          {...(isLoading && { 'aria-live': 'polite' })}
        >
          {isLoading ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin h-6 w-6 text-slate-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="sr-only">Loading {title}</span>
            </span>
          ) : (
            value
          )}
        </p>
      </div>
      {icon && (
        <div 
          className={`p-3 rounded-full bg-slate-700 ${color} flex-shrink-0`}
          aria-hidden="true"
          role="img"
          aria-label={`${title} icon`}
        >
          {icon}
        </div>
      )}
    </div>
  );

  const baseClasses = "bg-slate-800 p-6 rounded-xl shadow-lg transition-all duration-300 border border-slate-700";
  const interactiveClasses = (href || onClick) 
    ? "hover:shadow-sky-500/30 hover:border-slate-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-950" 
    : "";

  if (href) {
    return (
      <a 
        href={href}
        className={`${baseClasses} ${interactiveClasses} block`}
        aria-label={`View details for ${title}: ${value}`}
      >
        {cardContent}
      </a>
    );
  }

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={`${baseClasses} ${interactiveClasses} w-full text-left`}
        aria-label={`View details for ${title}: ${value}`}
        type="button"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div 
      className={baseClasses}
      role="img"
      aria-label={`${title}: ${value}`}
    >
      {cardContent}
    </div>
  );
};

export default StatCard;
