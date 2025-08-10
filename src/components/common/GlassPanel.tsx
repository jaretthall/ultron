import React from 'react';

interface GlassPanelProps {
  title?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'elevated';
}

// Enhanced glass container inspired by your design examples
const GlassPanel: React.FC<GlassPanelProps> = ({ 
  title, 
  actions, 
  className = '', 
  children, 
  variant = 'default' 
}) => {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'subtle':
        return [
          'bg-white/5 backdrop-blur-md',
          'border border-white/10',
          'shadow-[0_8px_32px_rgba(0,0,0,0.2)]'
        ];
      case 'elevated':
        return [
          'bg-white/10 backdrop-blur-xl',
          'border border-white/20',
          'shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
          'hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)]'
        ];
      default:
        return [
          'bg-white/[0.08] backdrop-blur-xl',
          'border border-white/[0.12]',
          'shadow-[0_12px_40px_rgba(0,0,0,0.25)]'
        ];
    }
  };

  const variantStyles = getVariantStyles(variant);

  return (
    <section
      className={[
        'rounded-2xl overflow-hidden transition-all duration-300',
        'hover:bg-white/[0.1] hover:border-white/[0.18]',
        'group relative',
        ...variantStyles,
        className
      ].join(' ')}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 rounded-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
      </div>

      {/* Header */}
      {(title || actions) && (
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          {title && (
            <h2 className="text-base sm:text-lg font-semibold text-white/90 group-hover:text-white transition-colors">
              {title}
            </h2>
          )}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative p-5">
        {children}
      </div>

      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 via-sky-500/5 to-cyan-500/5"></div>
      </div>
    </section>
  );
};

export default GlassPanel;