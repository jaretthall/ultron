export interface HealthBreakPreferences {
  // Lunch settings
  autoScheduleLunch: boolean;
  lunchStartTime: string; // "12:00"
  lunchDuration: number; // minutes
  lunchFlexibility: number; // minutes +/- from preferred time
  
  // Buffer settings
  defaultBufferTime: number; // minutes between tasks
  minimumBufferTime: number; // minimum buffer for back-to-back tasks
  
  // Break frequency
  maxContinuousWork: number; // max hours without a break
  shortBreakDuration: number; // minutes for short breaks
  
  // Working hours
  workDayStart: string; // "08:00"
  workDayEnd: string; // "17:00"
  
  // Meal preferences
  autoScheduleBreakfast: boolean;
  breakfastTime: string; // "08:00"
  autoScheduleDinner: boolean;
  dinnerTime: string; // "18:00"
}

export interface EventShortcut {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  color: string; // Tailwind color class
  eventTitle: string;
  eventDuration: number; // minutes
  createTask: boolean;
  taskTitle?: string;
  taskPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  taskTags: string[];
  isActive: boolean;
}

export interface QuickActionsPreferences {
  eventShortcuts: EventShortcut[];
}

export interface UserSchedulingPreferences {
  healthBreaks: HealthBreakPreferences;
  quickActions: QuickActionsPreferences;
  
  // Energy and focus preferences
  peakEnergyHours: string[]; // ["09:00", "10:00", "11:00"]
  lowEnergyHours: string[]; // ["14:00", "15:00"]
  
  // Task batching preferences
  batchSimilarTasks: boolean;
  preferLongerFocusBlocks: boolean;
  minimumFocusBlockDuration: number; // minutes
  
  // Communication preferences
  preferredMeetingTimes: string[]; // ["10:00", "14:00", "15:00"]
  noMeetingBlocks: string[]; // ["09:00-11:00"] for deep work
}

export const DEFAULT_HEALTH_BREAK_PREFERENCES: HealthBreakPreferences = {
  autoScheduleLunch: false, // Disabled by default
  lunchStartTime: "12:00",
  lunchDuration: 60,
  lunchFlexibility: 30,
  
  defaultBufferTime: 15,
  minimumBufferTime: 5,
  
  maxContinuousWork: 3,
  shortBreakDuration: 15,
  
  workDayStart: "08:00",
  workDayEnd: "17:00",
  
  autoScheduleBreakfast: false,
  breakfastTime: "08:00",
  autoScheduleDinner: false,
  dinnerTime: "18:00"
};

export const DEFAULT_EVENT_SHORTCUTS: EventShortcut[] = [
  {
    id: 'counseling',
    name: 'Counsel',
    icon: '🧠',
    color: 'teal',
    eventTitle: 'Counseling Session',
    eventDuration: 60,
    createTask: true,
    taskTitle: 'Progress Note for {clientName}',
    taskPriority: 'HIGH',
    taskTags: ['progress-note', 'therapy', 'documentation'],
    isActive: true
  },
  {
    id: 'meeting',
    name: 'Meeting',
    icon: '👥',
    color: 'blue',
    eventTitle: 'Meeting',
    eventDuration: 30,
    createTask: false,
    taskPriority: 'MEDIUM',
    taskTags: [],
    isActive: true
  },
  {
    id: 'focus-work',
    name: 'Focus',
    icon: '⚡',
    color: 'slate',
    eventTitle: 'Deep Work Session',
    eventDuration: 90,
    createTask: true,
    taskTitle: 'Review and follow-up on {taskName}',
    taskPriority: 'MEDIUM',
    taskTags: ['deep-work'],
    isActive: true
  }
];

export const DEFAULT_QUICK_ACTIONS_PREFERENCES: QuickActionsPreferences = {
  eventShortcuts: DEFAULT_EVENT_SHORTCUTS
};

export const DEFAULT_SCHEDULING_PREFERENCES: UserSchedulingPreferences = {
  healthBreaks: DEFAULT_HEALTH_BREAK_PREFERENCES,
  quickActions: DEFAULT_QUICK_ACTIONS_PREFERENCES,
  
  peakEnergyHours: ["09:00", "10:00", "11:00"],
  lowEnergyHours: ["14:00", "15:00"],
  
  batchSimilarTasks: true,
  preferLongerFocusBlocks: true,
  minimumFocusBlockDuration: 90,
  
  preferredMeetingTimes: ["10:00", "11:00", "14:00", "15:00"],
  noMeetingBlocks: ["09:00-11:00"]
};