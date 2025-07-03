import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string; // Tailwind color class e.g., 'text-sky-400'
  onClick?: () => void; // Optional click handler for navigation
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'text-sky-400', onClick }) => {
  const baseClasses = "bg-slate-800 p-6 rounded-xl shadow-lg transition-all duration-300";
  const clickableClasses = onClick 
    ? "hover:shadow-sky-500/30 hover:scale-[1.02] cursor-pointer hover:bg-slate-750 group" 
    : "hover:shadow-sky-500/30";

  const content = (
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium text-slate-400 uppercase tracking-wider ${onClick ? 'group-hover:text-sky-300' : ''}`}>
          {title}
        </p>
        <p className={`text-3xl font-semibold text-slate-100 mt-1 ${onClick ? 'group-hover:text-sky-200' : ''}`}>
          {value}
        </p>
        {onClick && (
          <p className="text-[10px] text-slate-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view details
          </p>
        )}
      </div>
      {icon && (
        <div className={`p-3 rounded-full bg-slate-700 ${color} ${onClick ? 'group-hover:scale-110 transition-transform' : ''}`}>
          {icon}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <div 
        className={`${baseClasses} ${clickableClasses}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`View ${title.toLowerCase()} details`}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${clickableClasses}`}>
      {content}
    </div>
  );
};

export default StatCard; 