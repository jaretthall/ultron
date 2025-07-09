import React from 'react';
import { useScreenSize } from '../ResponsiveLayout';

const RightSidebarComponent: React.FC = () => {
  const { isMobile } = useScreenSize();
  
  const handleViewAnalytics = () => {
    console.log('View Analytics clicked');
    // TODO: Implement analytics view
  };

  const handleExportData = () => {
    console.log('Export Project Data clicked');
    // TODO: Implement data export
  };

  const handleFocusMode = () => {
    console.log('Focus Mode clicked');
    // TODO: Implement focus mode
  };
  
  return (
    <aside className={`${isMobile ? 'w-full' : 'w-64'} bg-slate-800 ${isMobile ? '' : 'border-l border-slate-700'} overflow-y-auto`}>
      <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-slate-200 mb-4`}>Project Insights</h2>
        
        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-3">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={handleViewAnalytics}
                className="w-full text-left text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                📊 View Analytics
              </button>
              <button 
                onClick={handleExportData}
                className="w-full text-left text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                📋 Export Project Data
              </button>
              <button 
                onClick={handleFocusMode}
                className="w-full text-left text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                🎯 Focus Mode
              </button>
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-3">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Tips</h3>
            <div className="space-y-2 text-xs text-slate-400">
              <p>💡 Set deadlines to track urgency</p>
              <p>🏷️ Use tags to organize projects</p>
              <p>⚡ Adjust business relevance for priority</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebarComponent; 