import React, { useState, useEffect } from 'react';
import { Task, Project } from '../../../types';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (updatedTask: Task) => Promise<void>;
  projects: Project[];
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  projects
}) => {
  // Basic task fields
  const [title, setTitle] = useState(task.title);
  const [context, setContext] = useState(task.context);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [projectId, setProjectId] = useState(task.project_id || '');
  const [dueDate, setDueDate] = useState(() => {
    if (task.due_date) {
      const date = new Date(task.due_date);
      return date.toISOString().split('T')[0];
    }
    return '';
  });
  const [estimatedHours, setEstimatedHours] = useState(task.estimated_hours || 0);
  const [tags, setTags] = useState(task.tags?.join(', ') || '');
  const [progress, setProgress] = useState(task.progress || 0);
  const [dueTime, setDueTime] = useState(() => {
    if (task.due_date) {
      const date = new Date(task.due_date);
      return date.toTimeString().substring(0, 5);
    }
    return '';
  });

  // Time scheduling fields
  const [isTimeBlocked, setIsTimeBlocked] = useState(task.is_time_blocked || false);
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (task.scheduled_start) {
      const date = new Date(task.scheduled_start);
      return date.toISOString().split('T')[0];
    }
    return '';
  });
  const [scheduledStartTime, setScheduledStartTime] = useState(() => {
    if (task.scheduled_start) {
      const date = new Date(task.scheduled_start);
      return date.toTimeString().substring(0, 5);
    }
    return '';
  });
  const [scheduledEndTime, setScheduledEndTime] = useState(() => {
    if (task.scheduled_end) {
      const date = new Date(task.scheduled_end);
      return date.toTimeString().substring(0, 5);
    }
    return '';
  });

  // Flow-based fields
  const [microGoals, setMicroGoals] = useState('');
  const [challengeLevel, setChallengeLevel] = useState(5);
  const [scopeWhat, setScopeWhat] = useState('');
  const [scopeWhy, setScopeWhy] = useState('');
  const [scopeComplete, setScopeComplete] = useState('');
  const [minimumFlowHours, setMinimumFlowHours] = useState(2);
  const [minimumFlowMinutes, setMinimumFlowMinutes] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(2);
  const [engagementStrategy, setEngagementStrategy] = useState('sleep-to-flow');
  const [procrastinationCheck, setProcrastinationCheck] = useState('');

  useEffect(() => {
    setTitle(task.title);
    setContext(task.context);
    setPriority(task.priority);
    setStatus(task.status);
    setProjectId(task.project_id || '');
    if (task.due_date) {
      const date = new Date(task.due_date);
      setDueDate(date.toISOString().split('T')[0]);
      setDueTime(date.toTimeString().substring(0, 5));
    } else {
      setDueDate('');
      setDueTime('');
    }
    setEstimatedHours(task.estimated_hours || 0);
    setTags(task.tags?.join(', ') || '');
    setProgress(task.progress || 0);
    
    // Reset time scheduling fields
    setIsTimeBlocked(task.is_time_blocked || false);
    if (task.scheduled_start) {
      const startDate = new Date(task.scheduled_start);
      setScheduledDate(startDate.toISOString().split('T')[0]);
      setScheduledStartTime(startDate.toTimeString().substring(0, 5));
    } else {
      setScheduledDate('');
      setScheduledStartTime('');
    }
    if (task.scheduled_end) {
      const endDate = new Date(task.scheduled_end);
      setScheduledEndTime(endDate.toTimeString().substring(0, 5));
    } else {
      setScheduledEndTime('');
    }
    
    // Reset flow-based fields when task changes
    setMicroGoals('');
    setChallengeLevel(5);
    setScopeWhat('');
    setScopeWhy('');
    setScopeComplete('');
    setMinimumFlowHours(2);
    setMinimumFlowMinutes(0);
    setEnergyLevel(2);
    setEngagementStrategy('sleep-to-flow');
    setProcrastinationCheck('');
  }, [task]);

  // Helper functions for flow-based features
  const getChallengeDisplayText = (level: number): string => {
    const messages: { [key: number]: string } = {
      1: "Way too easy (will cause boredom)",
      2: "Too easy (might lose interest)", 
      3: "Slightly easy (good warm-up)",
      4: "Just right (flow sweet spot!)",
      5: "Perfect challenge (4% stretch)",
      6: "Slightly challenging (perfect for flow)",
      7: "Moderately hard (still manageable)",
      8: "Getting difficult (anxiety risk)",
      9: "Too hard (likely overwhelm)",
      10: "Extremely difficult (will cause anxiety)"
    };
    return messages[level] || "Unknown level";
  };

  const getEngagementTip = (strategy: string): string => {
    const tips: { [key: string]: string } = {
      'sleep-to-flow': '⚡ Strategy: Wake up and start this task within 60 seconds, no time to procrastinate',
      'lower-hurdle': '🎯 Strategy: Start with the easiest possible version to build momentum',
      'time-constraint': '⏰ Strategy: Set artificial deadline pressure to increase challenge level',
      'response-inhibition': '🚀 Strategy: Commit to starting before you can think about it'
    };
    return tips[strategy] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle due date with time (ensure timezone consistency)
    let formattedDueDate = undefined;
    if (dueDate) {
      if (dueTime) {
        // Create a Date object in local time, then convert to ISO string
        const localDateTime = new Date(`${dueDate}T${dueTime}:00`);
        formattedDueDate = localDateTime.toISOString();
      } else {
        // End of day in local time
        const localDateTime = new Date(`${dueDate}T23:59:59`);
        formattedDueDate = localDateTime.toISOString();
      }
    }

    // Handle scheduled time (ensure timezone consistency)
    let formattedScheduledStart = undefined;
    let formattedScheduledEnd = undefined;
    if (isTimeBlocked && scheduledDate && scheduledStartTime && scheduledEndTime) {
      const localStartDateTime = new Date(`${scheduledDate}T${scheduledStartTime}:00`);
      const localEndDateTime = new Date(`${scheduledDate}T${scheduledEndTime}:00`);
      formattedScheduledStart = localStartDateTime.toISOString();
      formattedScheduledEnd = localEndDateTime.toISOString();
    }

    const updatedTask: Task = {
      ...task,
      title,
      context,
      priority,
      status,
      project_id: projectId || undefined,
      due_date: formattedDueDate,
      estimated_hours: Number(estimatedHours) || 0,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      progress: progress,
      is_time_blocked: isTimeBlocked,
      scheduled_start: formattedScheduledStart,
      scheduled_end: formattedScheduledEnd
    };

    await onUpdateTask(updatedTask);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden w-full max-w-2xl mx-4 my-4 sm:my-8 min-h-fit max-h-[95vh] shadow-2xl">
        <div className={`${status === 'completed' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'} text-white p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Edit Task</h2>
              {status === 'completed' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Completed
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
        
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Basic Information Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-600 pb-2">
              Basic Information
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                placeholder="Enter task title..."
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Clear Micro-Goals
              </label>
              <textarea
                value={microGoals}
                onChange={(e) => setMicroGoals(e.target.value)}
                placeholder="Break this down into ridiculously specific steps:&#10;1. Open laptop&#10;2. Navigate to client file folder&#10;3. Open progress note template&#10;4. Write client name and session date&#10;5. Document session highlights..."
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white h-20 text-sm"
              />
              <div className="text-xs text-slate-400 mt-1">
                ✨ <strong>Flow Tip:</strong> Make each step so easy your brain has nothing to resist
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Context & Why
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Why does this matter? What's the bigger purpose? How does it connect to your goals?"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white h-20 text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Challenge-Skills Balance Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-600 pb-2">
              Challenge-Skills Balance
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Difficulty Level
              </label>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Too Easy (Boredom)</span>
                  <span className="text-green-400 font-semibold">4% Sweet Spot</span>
                  <span>Too Hard (Anxiety)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={challengeLevel}
                  onChange={(e) => setChallengeLevel(Number(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-red-500 via-green-500 to-red-500 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #10b981 45%, #10b981 55%, #ef4444 100%)`
                  }}
                />
                <div className="text-center text-sm text-slate-300 font-medium">
                  {getChallengeDisplayText(challengeLevel)}
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                🎯 <strong>Flow Tip:</strong> Sweet spot is 4% beyond your current skill level
              </div>
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Scope Definition
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={scopeWhat}
                  onChange={(e) => setScopeWhat(e.target.value)}
                  placeholder="What exactly needs to be done?"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm border-l-4 border-l-purple-500"
                />
                <input
                  type="text"
                  value={scopeWhy}
                  onChange={(e) => setScopeWhy(e.target.value)}
                  placeholder="Why does it need to be done?"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm border-l-4 border-l-purple-500"
                />
                <input
                  type="text"
                  value={scopeComplete}
                  onChange={(e) => setScopeComplete(e.target.value)}
                  placeholder="How will I know it's complete?"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm border-l-4 border-l-purple-500"
                />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                🧩 <strong>Clarity Boost:</strong> Define scope to avoid "Pandora's Box" effect
              </div>
            </div>
          </div>

          {/* Priority & Scheduling Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-600 pb-2">
              Priority & Scheduling
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['low', 'medium', 'high', 'urgent'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level as Task['priority'])}
                    className={`px-3 py-2 rounded text-xs font-medium uppercase tracking-wide transition-colors border-2 ${
                      priority === level
                        ? level === 'low' ? 'bg-green-600 border-green-500 text-white'
                        : level === 'medium' ? 'bg-yellow-600 border-yellow-500 text-white'
                        : level === 'high' ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-purple-600 border-purple-500 text-white'
                        : level === 'low' ? 'border-green-500 text-green-400 hover:bg-green-600 hover:text-white'
                        : level === 'medium' ? 'border-yellow-500 text-yellow-400 hover:bg-yellow-600 hover:text-white'
                        : level === 'high' ? 'border-red-500 text-red-400 hover:bg-red-600 hover:text-white'
                        : 'border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Due Date
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  placeholder="Due time"
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-300 mb-2">Minimum Flow Block</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <input
                    type="number"
                    value={minimumFlowHours}
                    onChange={(e) => setMinimumFlowHours(Number(e.target.value))}
                    min="1"
                    max="8"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-center"
                  />
                  <label className="block text-xs text-slate-400 mt-1">Hours</label>
                </div>
                <div className="text-center">
                  <input
                    type="number"
                    value={minimumFlowMinutes}
                    onChange={(e) => setMinimumFlowMinutes(Number(e.target.value))}
                    min="0"
                    max="59"
                    step="15"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-center"
                  />
                  <label className="block text-xs text-slate-400 mt-1">Minutes</label>
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                🌊 <strong>Flow Payoff:</strong> Minimum uninterrupted time needed to make struggle worthwhile
              </div>
              
              <div className="mt-3">
                <div className="text-xs text-slate-400 mb-2">Energy Level Required</div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setEnergyLevel(level)}
                      className={`w-3 h-3 rounded-full border-2 transition-colors ${
                        energyLevel >= level 
                          ? 'border-purple-500 bg-purple-500' 
                          : 'border-slate-500 hover:border-purple-400'
                      }`}
                      title={level === 1 ? 'Low energy' : level === 2 ? 'Medium energy' : 'High energy'}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Engagement Strategy
              </label>
              <select
                value={engagementStrategy}
                onChange={(e) => setEngagementStrategy(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              >
                <option value="sleep-to-flow">Sleep-to-Flow (Morning, within 60 seconds)</option>
                <option value="lower-hurdle">Lower the Hurdle (Start with easier version)</option>
                <option value="time-constraint">Time Constraint (Artificial deadline pressure)</option>
                <option value="response-inhibition">Response Inhibition (Bypass thinking)</option>
              </select>
              <div className="text-xs text-slate-400 mt-1">
                {getEngagementTip(engagementStrategy)}
              </div>
            </div>
            
            {/* Time Scheduling Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="timeBlocked"
                  checked={isTimeBlocked}
                  onChange={(e) => setIsTimeBlocked(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="timeBlocked" className="text-slate-300 text-sm font-medium">
                  Schedule this task at a specific time
                </label>
              </div>
              
              {isTimeBlocked && (
                <div className="space-y-3 pl-6 border-l-2 border-purple-500">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={scheduledStartTime}
                        onChange={(e) => setScheduledStartTime(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={scheduledEndTime}
                        onChange={(e) => setScheduledEndTime(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    ⏰ <strong>Time Blocking:</strong> This task will appear as a red bar in your calendar during the scheduled time
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress & Status Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-600 pb-2">
              Progress & Status
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Progress: {progress}%
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${progress}%, #475569 ${progress}%, #475569 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Not Started</span>
                  <span>In Progress</span>
                  <span>Completed</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Quick Complete Button */}
            {status !== 'completed' && (
              <button
                type="button"
                onClick={() => {
                  setStatus('completed');
                  setProgress(100);
                }}
                className="w-full mt-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mark as Complete
              </button>
            )}

            {/* Completed Status Indicator */}
            {status === 'completed' && (
              <div className="w-full mt-2 px-4 py-3 bg-green-900/30 border border-green-600 text-green-400 font-medium rounded-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Task Completed
              </div>
            )}
          </div>

          {/* Organization Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-600 pb-2">
              Organization
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., progress-note, therapy, documentation"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Procrastination Check
              </label>
              <div className="space-y-2">
                {[
                  { value: 'approach-avoidance', label: 'I want to do this but can\'t bring myself to start' },
                  { value: 'ambivalence', label: 'Something feels "off" about this task' },
                  { value: 'ready', label: 'I\'m ready to engage with this task' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 p-2 border border-slate-600 rounded hover:bg-slate-700 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="procrastination-check"
                      value={option.value}
                      checked={procrastinationCheck === option.value}
                      onChange={(e) => setProcrastinationCheck(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-slate-300">{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                🧠 <strong>Self-Awareness:</strong> Distinguish between procrastination and ambivalence
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-slate-600 bg-slate-800/50">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  // In a real implementation, this would call a delete function
                  console.log('Delete task:', task.id);
                  onClose();
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
            >
              Delete Task
            </button>
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal; 