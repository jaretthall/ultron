import React from 'react';

const RightSidebarComponent: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-800 border-l border-slate-700 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Project Insights</h2>
        
        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-3">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left text-sm text-slate-400 hover:text-slate-200 transition-colors">
                📊 View Analytics
              </button>
              <button className="w-full text-left text-sm text-slate-400 hover:text-slate-200 transition-colors">
                📋 Export Project Data
              </button>
              <button className="w-full text-left text-sm text-slate-400 hover:text-slate-200 transition-colors">
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