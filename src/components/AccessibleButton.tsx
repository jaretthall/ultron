import React, { forwardRef } from 'react';
import LoadingSpinner from './LoadingSpinner';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  // Base styles that apply to all buttons
  const baseStyles = [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950',
    'disabled:cursor-not-allowed disabled:opacity-50',
    fullWidth && 'w-full'
  ].filter(Boolean).join(' ');

  // Size-specific styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Variant-specific styles with high contrast ratios
  const variantStyles = {
    primary: [
      'bg-sky-600 text-white',
      'hover:bg-sky-700 focus:ring-sky-400',
      'disabled:bg-slate-600 disabled:text-slate-400'
    ].join(' '),
    secondary: [
      'bg-slate-700 text-slate-100 border border-slate-600',
      'hover:bg-slate-600 hover:border-slate-500 focus:ring-slate-400',
      'disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700'
    ].join(' '),
    success: [
      'bg-emerald-600 text-white',
      'hover:bg-emerald-700 focus:ring-emerald-400',
      'disabled:bg-slate-600 disabled:text-slate-400'
    ].join(' '),
    warning: [
      'bg-yellow-600 text-white',
      'hover:bg-yellow-700 focus:ring-yellow-400',
      'disabled:bg-slate-600 disabled:text-slate-400'
    ].join(' '),
    danger: [
      'bg-red-600 text-white',
      'hover:bg-red-700 focus:ring-red-400',
      'disabled:bg-slate-600 disabled:text-slate-400'
    ].join(' '),
    ghost: [
      'bg-transparent text-slate-300 border border-transparent',
      'hover:bg-slate-800 hover:text-slate-100 focus:ring-slate-400',
      'disabled:text-slate-600'
    ].join(' ')
  };

  const buttonClasses = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className
  ].join(' ');

  const isDisabled = disabled || isLoading;
  const displayText = isLoading && loadingText ? loadingText : children;

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={isDisabled}
      {...(isLoading && { 'aria-live': 'polite' })}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <LoadingSpinner 
          size={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} 
        />
      )}
      
      {/* Left icon */}
      {!isLoading && icon && iconPosition === 'left' && (
        <span className="mr-2" aria-hidden="true">
          {icon}
        </span>
      )}
      
      {/* Button text */}
      <span>
        {displayText}
      </span>
      
      {/* Right icon */}
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="ml-2" aria-hidden="true">
          {icon}
        </span>
      )}
      
      {/* Screen reader loading text */}
      {isLoading && (
        <span className="sr-only">
          {loadingText || 'Loading, please wait'}
        </span>
      )}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton; 