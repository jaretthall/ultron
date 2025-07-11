import React, { useState, useEffect } from 'react';
import { Task, Project } from '../../../types';
import { generateAIDailyPlan, AIServiceResult, DailyPlan } from '../../services/aiService';
import { useAppState } from '../../contexts/AppStateContext';

interface DailyPlanDisplayProps {
  tasks: Task[];
  projects: Project[];
  onEditTaskRequest?: (task: Task) => void;
}


const DailyPlanDisplay: React.FC<DailyPlanDisplayProps> = ({ tasks, projects, onEditTaskRequest }) => {
  const { state } = useAppState();
  const { userPreferences } = state;
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const generateDailyPlan = async (date: string) => {
    setLoading(true);
    setError(null);
    
    if (!userPreferences) {
      setError('User preferences not loaded');
      setLoading(false);
      return;
    }
    
    try {
      const dateObj = new Date(date);
      const result: AIServiceResult<DailyPlan> = await generateAIDailyPlan(
        dateObj,
        projects,
        tasks,
        userPreferences
      );

      if (result.success && result.data) {
        setDailyPlan(result.data);
      } else {
        throw new Error(result.error || 'Failed to generate daily plan');
      }
    } catch (err: any) {
      console.error('Error generating daily plan:', err);
      
      // Handle specific error types
      let errorMessage = 'Failed to generate daily plan';
      
      if (err.message?.includes('502') || err.message?.includes('Bad Gateway')) {
        errorMessage = 'AI planning service is temporarily unavailable. Please try again in a few minutes.';
      } else if (err.message?.includes('503') || err.message?.includes('Service Unavailable')) {
        errorMessage = 'AI service is not configured properly. Please check your settings.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The AI service may be slow. Please try again.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0) {
      generateDailyPlan(selectedDate);
    }
  }, [selectedDate, tasks.length]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEnergyLevelColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getContextColor = (score: number) => {
    if (score >= 80) return 'bg-purple-600';
    if (score >= 60) return 'bg-blue-600';
    return 'bg-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Today's AI-Generated Plan</h2>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-slate-300">Generating your personalized schedule...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Today's AI-Generated Plan</h2>
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-red-400 font-medium">Unable to generate plan</h3>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => generateDailyPlan(selectedDate)}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dailyPlan) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Today's AI-Generated Plan</h2>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-400 mb-4">No plan generated yet</p>
          <button
            onClick={() => generateDailyPlan(selectedDate)}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Generate Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Today's AI-Generated Plan</h2>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-slate-200 rounded-md px-3 py-1 text-sm"
          />
          <button
            onClick={() => generateDailyPlan(selectedDate)}
            className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
          >
            Regenerate
          </button>
        </div>
      </div>

      {/* Workload Summary */}
      <div className="bg-slate-700 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-slate-200 mb-3">Today's Workload</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-sky-400">{dailyPlan.recommended_schedule.length}</div>
            <div className="text-xs text-slate-400">Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{dailyPlan.workload_summary.total_scheduled_hours.toFixed(1)}h</div>
            <div className="text-xs text-slate-400">Scheduled Hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">{Math.round(dailyPlan.workload_summary.utilization_percentage)}%</div>
            <div className="text-xs text-slate-400">Capacity</div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {dailyPlan.recommended_schedule.map((item, index) => {
          const relatedTask = tasks.find(t => t.title === item.task_title);
          return (
          <div 
            key={index} 
            className={`bg-slate-700 rounded-lg p-4 transition-all ${
              onEditTaskRequest && relatedTask ? 'hover:bg-slate-600 cursor-pointer hover:scale-[1.02]' : ''
            }`}
            onClick={() => {
              if (onEditTaskRequest && relatedTask) {
                onEditTaskRequest(relatedTask);
              }
            }}
            title={onEditTaskRequest && relatedTask ? 'Click to edit task' : undefined}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-medium text-sky-400">
                  {formatTime(item.suggested_start_time)}
                </div>
                <div className="text-sm text-slate-400">
                  {item.suggested_duration_minutes}min
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${getContextColor(item.context_match_score)}`}></span>
                <span className={`text-xs ${getEnergyLevelColor(item.energy_match_score)}`}>
                  {item.energy_match_score}% energy match
                </span>
              </div>
            </div>
            <h4 className="text-slate-200 font-medium mb-1">{item.task_title}</h4>
            <p className="text-xs text-slate-400">{item.reasoning}</p>
          </div>
          );
        })}
      </div>

      {/* Focus Blocks */}
      {dailyPlan.focus_blocks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-slate-200 mb-3">Focus Blocks</h3>
          <div className="space-y-2">
            {dailyPlan.focus_blocks.map((block, index) => {
              const startTime = block.start_time;
              const endTime = new Date(new Date(`2000-01-01T${block.start_time}`).getTime() + block.duration_minutes * 60000).toTimeString().slice(0, 5);
              return (
                <div key={index} className="bg-blue-900/30 border border-blue-600 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-medium">
                      {formatTime(startTime)} - {formatTime(endTime)}
                    </span>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      {block.block_type}
                    </span>
                  </div>
                  <p className="text-blue-300 text-sm mt-1">{block.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {dailyPlan.ai_recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-slate-200 mb-3">AI Recommendations</h3>
          <div className="space-y-2">
            {dailyPlan.ai_recommendations.slice(0, 3).map((recommendation, index) => (
              <div key={index} className="bg-slate-700 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-sky-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-slate-300 text-sm">{recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPlanDisplay;