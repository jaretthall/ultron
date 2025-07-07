import React, { useState, useEffect } from 'react';
import { Task, UserPreferences } from '../../../types';
// import { format, startOfDay, endOfDay, addDays, isWithinInterval } from 'date-fns';
import { useAppState } from '../../contexts/AppStateContext';
import { tasksService } from '../../../services/databaseService';

interface TaskSchedulerProps {
  task: Task;
  selectedDate: Date;
  onScheduleUpdate: (task: Task) => void;
  onClose?: () => void;
}

interface ScheduledTask extends Task {
  scheduled_start: string;
  scheduled_end: string;
  scheduled_block_type: 'focus' | 'regular' | 'buffer';
  energy_match_score: number;
  context_match_score: number;
}

interface TimeSlot {
  start: string;
  end: string;
  type: 'business' | 'personal' | 'focus' | 'break' | 'buffer';
  available: boolean;
  energy_level: 'high' | 'medium' | 'low';
}

const TaskScheduler: React.FC<TaskSchedulerProps> = ({ 
  // task,
  selectedDate,
  onScheduleUpdate,
  onClose
}) => {
  const { state } = useAppState();
  const { userPreferences /*, tasks*/ } = state;

  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'automatic' | 'manual'>('automatic');
  const [filterContext, setFilterContext] = useState<'all' | 'business' | 'personal'>('all');
  const [filterEnergyLevel, setFilterEnergyLevel] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  useEffect(() => {
    loadAvailableTasks();
    generateTimeSlots();
  }, [selectedDate, userPreferences]);

  const loadAvailableTasks = async () => {
    try {
      setLoading(true);
      
      // Get available tasks (not blocked by dependencies)
      const availableTasksData = await tasksService.getAvailableTasks();
      
      // Filter tasks for the selected date or unscheduled tasks
      const dateString = selectedDate.toISOString().split('T')[0];
      const filteredTasks = availableTasksData.filter(task => 
        task.status !== 'completed' && 
        (!task.due_date || task.due_date >= dateString)
      );

      setAvailableTasks(filteredTasks);
    } catch (error) {
      console.error('Error loading available tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    if (!userPreferences) return;

    const slots: TimeSlot[] = [];
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][selectedDate.getDay()];
    const isBusinessDay = userPreferences.business_days?.includes(dayOfWeek as any) || false;

    if (isBusinessDay) {
      // Early morning personal time
      if (userPreferences.personal_time_early_morning) {
        addTimeSlots(slots, '06:00', userPreferences.business_hours_start || '09:00', 'personal', 'medium');
      }

      // Business hours with focus blocks
      addBusinessHourSlots(slots, userPreferences);

      // Evening personal time
      if (userPreferences.personal_time_weekday_evening) {
        addTimeSlots(slots, userPreferences.business_hours_end || '17:00', '22:00', 'personal', 'low');
      }
    } else if (userPreferences.personal_time_weekends) {
      // Weekend personal time
      addTimeSlots(slots, userPreferences.working_hours_start, userPreferences.working_hours_end, 'personal', 'medium');
    }

    setTimeSlots(slots);
  };

  const addBusinessHourSlots = (slots: TimeSlot[], prefs: UserPreferences) => {
    const startTime = prefs.business_hours_start || '09:00';
    const endTime = prefs.business_hours_end || '17:00';
    const focusBlockDuration = prefs.focus_block_duration || 90;
    const breakDuration = prefs.break_duration || 15;

    let currentTime = parseTime(startTime);
    const endTimeMinutes = parseTime(endTime);

    while (currentTime < endTimeMinutes) {
      // Determine energy level based on time of day
      const hour = Math.floor(currentTime / 60);
      let energyLevel: 'high' | 'medium' | 'low' = 'medium';
      
      if (hour >= 9 && hour < 11) energyLevel = 'high';
      else if (hour >= 11 && hour < 14) energyLevel = 'medium';
      else if (hour >= 14 && hour < 16) energyLevel = 'low'; // Post-lunch dip
      else if (hour >= 16 && hour < 18) energyLevel = 'medium';
      else energyLevel = 'low';

      // Focus block
      const focusEnd = Math.min(currentTime + focusBlockDuration, endTimeMinutes);
      slots.push({
        start: formatTime(currentTime),
        end: formatTime(focusEnd),
        type: 'focus',
        available: true,
        energy_level: energyLevel
      });

      currentTime = focusEnd;

      // Break (if not at end of day)
      if (currentTime < endTimeMinutes) {
        const breakEnd = Math.min(currentTime + breakDuration, endTimeMinutes);
        slots.push({
          start: formatTime(currentTime),
          end: formatTime(breakEnd),
          type: 'break',
          available: false,
          energy_level: 'low'
        });
        currentTime = breakEnd;
      }
    }
  };

  const addTimeSlots = (slots: TimeSlot[], start: string, end: string, type: 'business' | 'personal', energy: 'high' | 'medium' | 'low') => {
    slots.push({
      start,
      end,
      type,
      available: true,
      energy_level: energy
    });
  };

  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const calculateTaskScore = (task: Task, slot: TimeSlot): number => {
    let score = 0;

    // Energy level matching
    const taskEnergyLevel = task.energy_level || 'medium';
    if (taskEnergyLevel === slot.energy_level) score += 40;
    else if (
      (taskEnergyLevel === 'high' && slot.energy_level === 'medium') ||
      (taskEnergyLevel === 'low' && slot.energy_level === 'medium')
    ) score += 20;

    // Context matching
    const taskContext = task.task_context || 'inherited';
    if (taskContext === 'business' && slot.type === 'focus') score += 30;
    else if (taskContext === 'personal' && slot.type === 'personal') score += 30;
    else if (taskContext === 'inherited') score += 15;

    // Priority weighting
    switch (task.priority) {
      case 'urgent': score += 20; break;
      case 'high': score += 15; break;
      case 'medium': score += 10; break;
      case 'low': score += 5; break;
    }

    // Due date urgency
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const daysDiff = Math.ceil((dueDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) score += 15;
      else if (daysDiff <= 3) score += 10;
      else if (daysDiff <= 7) score += 5;
    }

    return score;
  };

  const generateAutomaticSchedule = () => {
    setLoading(true);
    
    const scheduled: ScheduledTask[] = [];
    const availableSlots = timeSlots.filter(slot => slot.available);
    const taskQueue = [...availableTasks].sort((a, b) => {
      // Sort by priority and due date
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Then by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return 0;
    });

    // Schedule tasks using intelligent matching
    for (const task of taskQueue) {
      const bestSlot = availableSlots
        .map(slot => ({ slot, score: calculateTaskScore(task, slot) }))
        .sort((a, b) => b.score - a.score)[0];

      if (bestSlot && bestSlot.score > 30) {
        const taskDuration = Math.min(task.estimated_hours * 60, parseTime(bestSlot.slot.end) - parseTime(bestSlot.slot.start));
        
        scheduled.push({
          ...task,
          scheduled_start: bestSlot.slot.start,
          scheduled_end: formatTime(parseTime(bestSlot.slot.start) + taskDuration),
          scheduled_block_type: bestSlot.slot.type === 'focus' ? 'focus' : 'regular',
          energy_match_score: bestSlot.score,
          context_match_score: bestSlot.score
        });

        // Remove the used slot
        const slotIndex = availableSlots.indexOf(bestSlot.slot);
        if (slotIndex > -1) {
          availableSlots.splice(slotIndex, 1);
        }
      }
    }

    setScheduledTasks(scheduled);
    setLoading(false);

    if (onScheduleUpdate) {
      onScheduleUpdate(scheduled[0]);
    }
  };

  const filteredTasks = availableTasks.filter(task => {
    const contextMatch = filterContext === 'all' || 
      (filterContext === 'business' && task.task_context === 'business') ||
      (filterContext === 'personal' && task.task_context === 'personal') ||
      task.task_context === 'inherited';
    
    const energyMatch = filterEnergyLevel === 'all' || task.energy_level === filterEnergyLevel;
    
    return contextMatch && energyMatch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 text-slate-100 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div>
            <h2 className="text-2xl font-bold">Task Scheduler</h2>
            <p className="text-slate-400">
              Intelligent scheduling for {selectedDate.toLocaleDateString('default', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300"
            title="Close Task Scheduler"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600 bg-slate-700">
          <div className="flex items-center space-x-4">
            <div className="flex border border-slate-600 rounded-lg">
              <button
                onClick={() => setScheduleMode('automatic')}
                className={`px-3 py-2 text-sm ${
                  scheduleMode === 'automatic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                }`}
              >
                Automatic
              </button>
              <button
                onClick={() => setScheduleMode('manual')}
                className={`px-3 py-2 text-sm border-l border-slate-600 ${
                  scheduleMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                }`}
              >
                Manual
              </button>
            </div>

            <select
              value={filterContext}
              onChange={(e) => setFilterContext(e.target.value as any)}
              className="border border-slate-600 bg-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm"
              title="Filter tasks by context"
            >
              <option value="all">All Contexts</option>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>

            <select
              value={filterEnergyLevel}
              onChange={(e) => setFilterEnergyLevel(e.target.value as any)}
              className="border border-slate-600 bg-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm"
              title="Filter tasks by energy level"
            >
              <option value="all">All Energy Levels</option>
              <option value="high">High Energy</option>
              <option value="medium">Medium Energy</option>
              <option value="low">Low Energy</option>
            </select>
          </div>

          <button
            onClick={generateAutomaticSchedule}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Schedule'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Available Tasks */}
          <div className="w-1/3 border-r border-slate-600">
            <div className="p-4 border-b border-slate-600">
              <h3 className="font-semibold">Available Tasks ({filteredTasks.length})</h3>
            </div>
            <div className="overflow-auto h-full p-4">
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="border border-slate-600 bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition-colors cursor-move"
                    draggable
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        task.priority === 'urgent' ? 'bg-red-900/50 text-red-300' :
                        task.priority === 'high' ? 'bg-orange-900/50 text-orange-300' :
                        task.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>Duration: {task.estimated_hours}h</div>
                      {task.energy_level && (
                        <div>Energy: {task.energy_level}</div>
                      )}
                      {task.task_context && (
                        <div>Context: {task.task_context}</div>
                      )}
                      {task.due_date && (
                        <div>Due: {new Date(task.due_date).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time Slots */}
          <div className="w-1/3 border-r border-slate-600">
            <div className="p-4 border-b border-slate-600">
              <h3 className="font-semibold">Time Slots</h3>
            </div>
            <div className="overflow-auto h-full p-4">
              <div className="space-y-2">
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${
                      slot.available ? 'border-green-600 bg-green-900/20' : 'border-slate-600 bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {slot.start} - {slot.end}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          slot.type === 'focus' ? 'bg-blue-900/50 text-blue-300' :
                          slot.type === 'business' ? 'bg-purple-900/50 text-purple-300' :
                          slot.type === 'personal' ? 'bg-green-900/50 text-green-300' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {slot.type}
                        </span>
                        <span className={`w-3 h-3 rounded-full ${
                          slot.energy_level === 'high' ? 'bg-red-400' :
                          slot.energy_level === 'medium' ? 'bg-yellow-400' :
                          'bg-green-400'
                        }`} title={`${slot.energy_level} energy`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scheduled Tasks */}
          <div className="w-1/3">
            <div className="p-4 border-b border-slate-600">
              <h3 className="font-semibold">Scheduled Tasks ({scheduledTasks.length})</h3>
            </div>
            <div className="overflow-auto h-full p-4">
              <div className="space-y-3">
                {scheduledTasks.map(task => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-3 bg-blue-900/20 border-blue-500/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <span className="text-xs text-blue-300 font-medium">
                        Score: {task.energy_match_score}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="font-medium">
                        {task.scheduled_start} - {task.scheduled_end}
                      </div>
                      <div>Block: {task.scheduled_block_type}</div>
                      <div>Priority: {task.priority}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-600 bg-slate-700">
          <div className="text-sm text-slate-400">
            {scheduledTasks.length} tasks scheduled • {filteredTasks.length - scheduledTasks.length} remaining
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (onScheduleUpdate) onScheduleUpdate(scheduledTasks[0]);
                if (onClose) onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskScheduler; 