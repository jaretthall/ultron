import React from 'react';

interface LoadingSpinnerProps {
  size?: string;
  color?: string;
  label?: string;
  inline?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'h-8 w-8', 
  color = 'text-sky-400',
  label = 'Loading',
  inline = false
}) => {
  return (
    <div 
      className={inline ? 'inline-flex items-center' : 'flex items-center justify-center'}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg 
        className={`animate-spin ${color} ${size}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span className="sr-only">{label}...</span>
      {!inline && (
        <span className="ml-2 text-sm text-slate-400 hidden sm:inline">
          {label}...
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
