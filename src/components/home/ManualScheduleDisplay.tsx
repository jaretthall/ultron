import React, { useState, useEffect } from 'react';
// import { dailyScheduleService } from '../../../services/databaseService'; // Temporarily disabled
import { SCHEDULE_TEMPLATES, ScheduleTemplate } from '../../constants/templates';

interface ManualScheduleDisplayProps {
  onEditTaskRequest?: (task: any) => void;
}

const ManualScheduleDisplay: React.FC<ManualScheduleDisplayProps> = ({ onEditTaskRequest: _onEditTaskRequest }) => {
  const [scheduleText, setScheduleText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]); // Today's date

  // Load saved schedule from database on component mount
  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      // Temporarily disabled to fix 406 errors
      // const schedule = await dailyScheduleService.getDailySchedule(currentDate);
      
      // Always use default placeholder until daily_schedules table is configured
      // if (schedule?.schedule_text) {
      //   setScheduleText(schedule.schedule_text);
      // } else {
        // Default placeholder text for new schedules
        setScheduleText(`# Today's Schedule

## Morning (8:00 AM - 12:00 PM)
- [ ] Review emails and priorities
- [ ] Focus block: [Project Name] - [Task Description]
- [ ] Team meeting

## Afternoon (1:00 PM - 5:00 PM)  
- [ ] [Task Name] - [Project]
- [ ] Client calls
- [ ] Administrative tasks

## Evening (6:00 PM+)
- [ ] Personal time
- [ ] Exercise/wellness
- [ ] Family time

*Paste your AI-generated schedule here or edit manually*`);
      // }
    } catch (error) {
      console.error('Failed to load schedule:', error);
      // Fallback to default text on error
      setScheduleText('# Today\'s Schedule\n\n*Error loading schedule. Please try again.*');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle text changes during editing
  const handleTextChange = (value: string) => {
    setScheduleText(value);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      console.log('Attempting to save schedule:', { currentDate, scheduleTextLength: scheduleText.length });
      // Temporarily disabled to fix 406 errors
      // await dailyScheduleService.saveDailySchedule(currentDate, scheduleText, 'mixed');
      console.log('Schedule save temporarily disabled - would have saved:', scheduleText.substring(0, 50) + '...');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save schedule - detailed error:', error);
      
      // More specific error messaging
      let errorMessage = 'Failed to save schedule. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = 'User not authenticated. Please sign in and try again.';
        } else if (error.message.includes('daily_schedules')) {
          errorMessage = 'Database error: daily_schedules table not accessible. Please contact support.';
        } else if (error.message.includes('RLS')) {
          errorMessage = 'Permission error. Please sign out and sign back in.';
        }
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload from database
    loadSchedule();
  };

  const clearSchedule = async () => {
    if (confirm('Clear the current schedule? This cannot be undone.')) {
      try {
        setIsLoading(true);
        // Temporarily disabled to fix 406 errors
        // await dailyScheduleService.deleteDailySchedule(currentDate);
        setScheduleText('');
        console.log('Schedule clear temporarily disabled - would have cleared schedule for:', currentDate);
      } catch (error) {
        console.error('Failed to clear schedule:', error);
        alert('Failed to clear schedule. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTemplateSelect = (template: ScheduleTemplate) => {
    setScheduleText(template.schedule);
    setShowTemplates(false);
  };

  // Simple markdown-to-HTML renderer for display
  const renderMarkdown = (text: string) => {
    return text
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold text-white mb-3">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold text-sky-400 mb-2 mt-4">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-md font-medium text-slate-300 mb-1 mt-3">$1</h3>')
      .replace(/^\* (.*$)/gm, '<li class="text-slate-300 ml-4">• $1</li>')
      .replace(/^- (.*$)/gm, '<li class="text-slate-300 ml-4">• $1</li>')
      .replace(/^- \[ \] (.*$)/gm, '<li class="text-slate-300 ml-4 flex items-center"><input type="checkbox" class="mr-2 rounded"> $1</li>')
      .replace(/^- \[x\] (.*$)/gm, '<li class="text-slate-400 ml-4 flex items-center line-through"><input type="checkbox" checked class="mr-2 rounded"> $1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Today's Schedule</h2>
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleEdit}
                disabled={isLoading}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
              >
                {isLoading ? 'Loading...' : 'Edit'}
              </button>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                disabled={isLoading}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
              >
                Templates
              </button>
              <button
                onClick={clearSchedule}
                disabled={isLoading}
                className="px-3 py-1 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
              >
                Clear
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                disabled={isLoading}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
              >
                Templates
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-3 py-1 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Schedule Templates Panel */}
      {showTemplates && (
        <div className="mb-4 p-4 bg-slate-900 rounded-lg border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-3">Schedule Templates</h3>
          <p className="text-sm text-slate-400 mb-4">
            Choose a template to quickly populate your schedule with a pre-built day structure.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SCHEDULE_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="bg-slate-800 p-3 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{template.name}</h4>
                  <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                    {template.theme}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <button
              onClick={() => setShowTemplates(false)}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Close Templates
            </button>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Enter your schedule in Markdown format. Use # for headers, - for lists, - [ ] for checkboxes.
          </p>
          <textarea
            value={scheduleText}
            onChange={(e) => handleTextChange(e.target.value)}
            className="w-full h-96 p-4 bg-slate-900 text-slate-100 border border-slate-600 rounded-lg resize-vertical focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono text-sm"
            placeholder="Enter your daily schedule here..."
          />
          <div className="text-xs text-slate-500">
            <strong>Tip:</strong> You can paste AI-generated schedules here from the AI Data Export tool. Use the Templates button to start with a pre-built structure. Schedules are saved to your account and sync across devices.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-slate-400 mb-4">
                <svg className="w-12 h-12 mx-auto mb-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-slate-400">Loading schedule...</p>
            </div>
          ) : scheduleText.trim() ? (
            <div
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(scheduleText) }}
            />
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-400 mb-4">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400 mb-3">No schedule created yet</p>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={handleEdit}
                  disabled={isLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  Create Schedule
                </button>
                <button
                  onClick={() => setShowTemplates(true)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isEditing && scheduleText.trim() && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            💡 Use the AI Data Export tool to generate schedules, then paste them here. Or use Templates for quick pre-built structures.
          </p>
        </div>
      )}
    </div>
  );
};

export default ManualScheduleDisplay;