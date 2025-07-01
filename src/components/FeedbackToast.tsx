import React, { useEffect } from 'react';

interface FeedbackToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

const FeedbackToast: React.FC<FeedbackToastProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const baseClasses = "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-sm z-[100]";
  const typeClasses = type === 'success' 
    ? "bg-green-600 text-white" 
    : "bg-red-600 text-white";

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button 
          onClick={onDismiss} 
          className="ml-4 text-xl font-semibold leading-none hover:opacity-75"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default FeedbackToast; 