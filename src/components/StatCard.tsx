import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string; // Tailwind color class e.g., 'text-sky-400'
  onClick?: () => void; // Optional click handler for navigation
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'text-sky-400', onClick }) => {
  const baseClasses = "bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.25)] p-6 rounded-xl transition-all duration-300 relative overflow-hidden group";
  const clickableClasses = onClick 
    ? "hover:bg-white/[0.12] hover:border-white/[0.18] hover:scale-[1.02] cursor-pointer hover:shadow-[0_16px_50px_rgba(0,0,0,0.35)]" 
    : "hover:bg-white/[0.10] hover:border-white/[0.16] hover:shadow-[0_16px_50px_rgba(0,0,0,0.3)]";

  const content = (
    <>
      {/* Glass reflection effects */}
      <div className="absolute inset-0 rounded-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/30 via-transparent to-transparent"></div>
      </div>
      
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/8 via-sky-500/8 to-slate-400/8"></div>
      </div>

      <div className="relative flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium text-white/70 uppercase tracking-wider transition-colors ${onClick ? 'group-hover:text-white/90' : ''}`}>
            {title}
          </p>
          <p className={`text-3xl font-semibold text-white/95 mt-1 transition-colors ${onClick ? 'group-hover:text-white' : ''}`}>
            {value}
          </p>
          {onClick && (
            <p className="text-[10px] text-white/40 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 ${color} ${onClick ? 'group-hover:scale-110 transition-transform group-hover:bg-white/15' : ''}`}>
            {icon}
          </div>
        )}
      </div>
    </>
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

// Memoize StatCard for performance optimization
export default React.memo(StatCard, (prevProps, nextProps) => {
  // Optimize re-renders by checking specific properties
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.color === nextProps.color &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.icon === nextProps.icon
  );
}); 