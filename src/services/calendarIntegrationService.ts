// Calendar Integration Service
// Merges tasks, events, schedules, and AI suggestions into unified calendar views
import { Task, Schedule, DailySchedule, TaskStatus } from '../../types';
import { tasksService, schedulesService } from '../../services/databaseService';
import { getCustomAuthUser } from '../contexts/CustomAuthContext';
import { HealthBreakPreferences, DEFAULT_HEALTH_BREAK_PREFERENCES } from '../types/userPreferences';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'deadline' | 'work_session' | 'event' | 'counseling_session' | 'health_break' | 'meal_break' | 'wellness_break';
  source: 'task' | 'schedule' | 'ai_generated' | 'manual';
  editable: boolean; // AI can only edit AI-generated items
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  taskId?: string;
  projectId?: string;
  scheduleId?: string;
  metadata?: {
    estimatedHours?: number;
    energyLevel?: 'low' | 'medium' | 'high';
    progress?: number;
    aiSuggested?: boolean;
    confidence?: number;
    timeBlocked?: boolean;
  };
}

export interface AIScheduleSuggestion {
  id: string;
  taskId: string;
  taskTitle: string;
  taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
  taskProject?: string;
  suggestedStart: Date;
  suggestedEnd: Date;
  confidence: number;
  reasoning: string;
  status: 'pending' | 'approved' | 'denied' | 'modified';
  conflictsWith?: string[]; // IDs of conflicting events
}

export interface CalendarViewData {
  events: CalendarEvent[];
  suggestions: AIScheduleSuggestion[];
  workSessions: CalendarEvent[];
  deadlines: CalendarEvent[];
  fixedEvents: CalendarEvent[]; // Cannot be modified by AI
}

export class CalendarIntegrationService {
  private healthBreakPreferences: HealthBreakPreferences = DEFAULT_HEALTH_BREAK_PREFERENCES;

  /**
   * Update health break preferences
   */
  updateHealthBreakPreferences(preferences: Partial<HealthBreakPreferences>) {
    this.healthBreakPreferences = { ...this.healthBreakPreferences, ...preferences };
  }

  /**
   * Get all calendar data for a date range with fresh AI suggestions
   */
  async getCalendarDataWithReset(startDate: Date, endDate: Date): Promise<CalendarViewData> {
    console.log('🤖 Getting calendar data with fresh AI suggestions reset');
    await this.resetAISuggestions();
    return this.getCalendarData(startDate, endDate);
  }

  /**
   * Force regenerate AI suggestions ignoring existing work sessions (for debugging)
   */
  async forceRegenerateAISuggestions(startDate: Date, endDate: Date): Promise<CalendarViewData> {
    console.log('🤖 FORCE REGENERATING AI suggestions - ignoring existing work sessions');
    try {
      const user = getCustomAuthUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Fetch all data sources
      const [tasks, schedules] = await Promise.all([
        tasksService.getAll(),
        schedulesService.getAll()
      ]);
      
      const dailySchedules: DailySchedule[] = [];
      const filteredTasks = this.filterTasksByDateRange(tasks, startDate, endDate);
      const filteredSchedules = this.filterSchedulesByDateRange(schedules, startDate, endDate);

      // Convert to calendar events
      const events: CalendarEvent[] = [
        ...this.convertTasksToEvents(filteredTasks),
        ...this.convertSchedulesToEvents(filteredSchedules),
        ...await this.convertDailySchedulesToEvents(dailySchedules)
      ];

      // Add health/wellness breaks
      const healthBreaks = this.generateHealthBreaks(startDate, endDate, events);
      events.push(...healthBreaks);
      const wellnessBreaks = this.generateWellnessBreaks(startDate, endDate, events);
      events.push(...wellnessBreaks);

      // FORCE generate suggestions by temporarily clearing work session data
      const forcedTasks = tasks.map(task => ({
        ...task,
        work_session_scheduled_start: undefined,
        work_session_scheduled_end: undefined
      }));

      const suggestions = await this.generateAIScheduleSuggestions(forcedTasks, events);

      const workSessions = events.filter(e => e.type === 'work_session');
      const deadlines = events.filter(e => e.type === 'deadline');
      const fixedEvents = events.filter(e => !e.editable);

      return {
        events,
        suggestions,
        workSessions,
        deadlines,
        fixedEvents
      };

    } catch (error) {
      console.error('Error force generating AI suggestions:', error);
      throw error;
    }
  }

  /**
   * Get all calendar data for a date range
   */
  async getCalendarData(startDate: Date, endDate: Date): Promise<CalendarViewData> {
    try {
      const user = getCustomAuthUser();
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Fetching calendar data for range:', { startDate, endDate });

      // Fetch all data sources in parallel
      const [tasks, schedules] = await Promise.all([
        tasksService.getAll(),
        schedulesService.getAll()
      ]);
      
      // Temporarily disable daily schedules to fix 406 error
      const dailySchedules: DailySchedule[] = [];

      // Filter data to date range
      const filteredTasks = this.filterTasksByDateRange(tasks, startDate, endDate);
      const filteredSchedules = this.filterSchedulesByDateRange(schedules, startDate, endDate);

      // Convert to calendar events
      const events: CalendarEvent[] = [
        ...this.convertTasksToEvents(filteredTasks),
        ...this.convertSchedulesToEvents(filteredSchedules),
        ...await this.convertDailySchedulesToEvents(dailySchedules)
      ];

      // Add automatic health breaks
      const healthBreaks = this.generateHealthBreaks(startDate, endDate, events);
      events.push(...healthBreaks);

      // Add AI wellness suggestions (lunch, breaks, walks)
      const wellnessBreaks = this.generateWellnessBreaks(startDate, endDate, events);
      events.push(...wellnessBreaks);

      // Separate by type
      const workSessions = events.filter(e => e.type === 'work_session');
      const deadlines = events.filter(e => e.type === 'deadline');
      const fixedEvents = events.filter(e => !e.editable);

      // Generate AI suggestions for unscheduled work sessions
      const suggestions = await this.generateAIScheduleSuggestions(filteredTasks, events);

      return {
        events,
        suggestions,
        workSessions,
        deadlines,
        fixedEvents
      };

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      throw error;
    }
  }

  /**
   * Convert tasks to calendar events (both work sessions and deadlines)
   */
  private convertTasksToEvents(tasks: Task[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // Filter out completed tasks from calendar display
    const activeTasks = tasks.filter(task => task.status !== 'completed');

    activeTasks.forEach(task => {
      // Add deadline event if task has due_date
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const endDate = new Date(dueDate);
        
        // Debug logging for deadline time issues
        console.log(`🐛 DEADLINE DEBUG - Task: "${task.title}"`);
        console.log(`🐛 Raw due_date: ${task.due_date}`);
        console.log(`🐛 Parsed dueDate: ${dueDate.toISOString()}`);
        console.log(`🐛 Local time: ${dueDate.toLocaleString()}`);
        console.log(`🐛 Hours: ${dueDate.getHours()}, Minutes: ${dueDate.getMinutes()}`);
        
        // If the due date has a specific time, make it a 30-minute deadline block for visibility
        // If it's just a date (midnight), keep it as all-day
        if (dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0) {
          endDate.setMinutes(endDate.getMinutes() + 30);
          console.log(`🐛 Timed deadline: ${dueDate.toLocaleString()} - ${endDate.toLocaleString()}`);
        } else {
          console.log(`🐛 All-day deadline: ${dueDate.toLocaleString()}`);
        }
        
        events.push({
          id: `deadline-${task.id}`,
          title: `⏰ ${task.title} (Due)`,
          start: dueDate,
          end: endDate,
          type: 'deadline',
          source: 'task',
          editable: false, // Deadlines set by user cannot be changed by AI
          priority: task.priority,
          taskId: task.id,
          projectId: task.project_id,
          metadata: {
            estimatedHours: task.estimated_hours,
            energyLevel: task.energy_level,
            progress: task.progress
          }
        });
      }

      // Add work session event if task has scheduled work time
      if (task.work_session_scheduled_start && task.work_session_scheduled_end) {
        events.push({
          id: `work-${task.id}`,
          title: `🔨 ${task.title}`,
          start: new Date(task.work_session_scheduled_start),
          end: new Date(task.work_session_scheduled_end),
          type: 'work_session',
          source: (task.ai_suggested || false) ? 'ai_generated' : 'manual',
          editable: task.ai_suggested || false, // AI can modify its own suggestions
          priority: task.priority,
          taskId: task.id,
          projectId: task.project_id,
          metadata: {
            estimatedHours: task.estimated_hours,
            energyLevel: task.energy_level,
            progress: task.progress,
            aiSuggested: task.ai_suggested || false
          }
        });
      }

      // Add scheduled task event if task has scheduled time
      if (task.is_time_blocked && task.scheduled_start && task.scheduled_end) {
        events.push({
          id: `scheduled-${task.id}`,
          title: `🔴 ${task.title}`,
          start: new Date(task.scheduled_start),
          end: new Date(task.scheduled_end),
          type: 'work_session',
          source: 'manual',
          editable: false, // User-scheduled tasks cannot be changed by AI
          priority: task.priority,
          taskId: task.id,
          projectId: task.project_id,
          metadata: {
            estimatedHours: task.estimated_hours,
            energyLevel: task.energy_level,
            progress: task.progress,
            timeBlocked: true
          }
        });
      }
    });

    return events;
  }

  /**
   * Convert schedule entries to calendar events
   */
  private convertSchedulesToEvents(schedules: Schedule[]): CalendarEvent[] {
    return schedules.map(schedule => {
      const startDate = new Date(schedule.start_date);
      const endDate = new Date(schedule.end_date);
      
      // Debug counseling session times
      if (schedule.event_type?.includes('counseling')) {
        console.log('🩺 COUNSELING DISPLAY - Raw start from DB:', schedule.start_date);
        console.log('🩺 COUNSELING DISPLAY - Raw end from DB:', schedule.end_date);
        console.log('🩺 COUNSELING DISPLAY - Parsed start (local time):', startDate.toLocaleString());
        console.log('🩺 COUNSELING DISPLAY - Parsed end (local time):', endDate.toLocaleString());
        console.log('🩺 COUNSELING DISPLAY - Parsed start (ISO):', startDate.toISOString());
        console.log('🩺 COUNSELING DISPLAY - User timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
      
      return {
        id: `schedule-${schedule.id}`,
        title: schedule.title,
        start: startDate,
        end: endDate,
        type: schedule.event_type?.includes('counseling') ? 'counseling_session' : 'event',
        source: 'schedule' as const,
        editable: true, // Allow user to edit schedule events
        scheduleId: schedule.id,
        taskId: schedule.task_id,
        metadata: {
          aiSuggested: false
        }
      };
    });
  }

  /**
   * Parse daily schedules (markdown text) to extract time blocks
   */
  private async convertDailySchedulesToEvents(dailySchedules: DailySchedule[]): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    for (const schedule of dailySchedules) {
      const parsedEvents = this.parseMarkdownSchedule(schedule.schedule_text, schedule.schedule_date);
      events.push(...parsedEvents.map(event => ({
        ...event,
        id: `daily-${schedule.id}-${event.id}`,
        source: 'ai_generated' as const,
        editable: true // AI-generated schedules can be modified
      })));
    }

    return events;
  }

  /**
   * Parse markdown schedule text to extract time blocks
   */
  private parseMarkdownSchedule(markdownText: string, date: string): Omit<CalendarEvent, 'source' | 'editable'>[] {
    const events: Omit<CalendarEvent, 'source' | 'editable'>[] = [];
    const lines = markdownText.split('\n');
    const baseDate = new Date(date);

    let currentEventId = 0;

    for (const line of lines) {
      // Match time patterns like "9:00 AM - 10:15 AM (1h 15m) - Task Name"
      const timeBlockMatch = line.match(/\s*-\s*\[\s*\]\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(?:\([^)]+\))?\s*-\s*(.+)/i);
      
      if (timeBlockMatch) {
        const [, startTime, endTime, taskTitle] = timeBlockMatch;
        
        try {
          const startDateTime = this.parseTimeToDate(startTime, baseDate);
          const endDateTime = this.parseTimeToDate(endTime, baseDate);
          
          // Extract task details from title
          const { title, priority, type } = this.parseTaskDetails(taskTitle);
          
          events.push({
            id: `parsed-${currentEventId++}`,
            title,
            start: startDateTime,
            end: endDateTime,
            type: type,
            priority: priority,
            metadata: {
              aiSuggested: true,
              confidence: 0.8 // Default confidence for parsed schedules
            }
          });
        } catch (error) {
          console.warn('Failed to parse time block:', line, error);
        }
      }
    }

    return events;
  }

  /**
   * Parse time string like "9:00 AM" to Date object
   */
  private parseTimeToDate(timeStr: string, baseDate: Date): Date {
    const [time, period] = timeStr.trim().split(/\s+/);
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period?.toUpperCase() === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period?.toUpperCase() === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    const date = new Date(baseDate);
    date.setHours(hour24, minutes, 0, 0);
    return date;
  }

  /**
   * Extract task details from parsed title
   */
  private parseTaskDetails(title: string): { title: string; priority?: 'low' | 'medium' | 'high' | 'urgent'; type: 'work_session' | 'event' } {
    // Extract priority from patterns like "(Priority: High)"
    const priorityMatch = title.match(/\(Priority:\s*(Low|Medium|High|Urgent)\)/i);
    const priority = priorityMatch ? priorityMatch[1].toLowerCase() as 'low' | 'medium' | 'high' | 'urgent' : undefined;
    
    // Clean title
    const cleanTitle = title.replace(/\(Priority:\s*\w+\)/i, '').replace(/\(Progress:\s*\d+%\)/i, '').trim();
    
    // Determine type based on title patterns
    const type = cleanTitle.toLowerCase().includes('meeting') || 
                 cleanTitle.toLowerCase().includes('session') ? 'event' : 'work_session';
    
    return { title: cleanTitle, priority, type };
  }

  /**
   * Generate automatic health breaks (lunch, short breaks, buffers)
   */
  private generateHealthBreaks(startDate: Date, endDate: Date, existingEvents: CalendarEvent[]): CalendarEvent[] {
    const healthBreaks: CalendarEvent[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Skip weekends if this is a business context
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      if (!isWeekend) {
        // Generate lunch break
        if (this.healthBreakPreferences.autoScheduleLunch) {
          const lunchBreak = this.generateLunchBreak(currentDate, existingEvents);
          if (lunchBreak) {
            healthBreaks.push(lunchBreak);
          }
        }

        // Generate meal breaks
        if (this.healthBreakPreferences.autoScheduleBreakfast) {
          const breakfast = this.generateMealBreak(currentDate, 'breakfast', this.healthBreakPreferences.breakfastTime);
          if (breakfast) healthBreaks.push(breakfast);
        }

        if (this.healthBreakPreferences.autoScheduleDinner) {
          const dinner = this.generateMealBreak(currentDate, 'dinner', this.healthBreakPreferences.dinnerTime);
          if (dinner) healthBreaks.push(dinner);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return healthBreaks;
  }

  /**
   * Generate lunch break with smart conflict resolution
   */
  private generateLunchBreak(date: Date, existingEvents: CalendarEvent[]): CalendarEvent | null {
    const preferences = this.healthBreakPreferences;
    const [hours, minutes] = preferences.lunchStartTime.split(':').map(Number);
    
    // Try preferred time first
    let lunchStart = new Date(date);
    lunchStart.setHours(hours, minutes, 0, 0);
    let lunchEnd = new Date(lunchStart);
    lunchEnd.setMinutes(lunchEnd.getMinutes() + preferences.lunchDuration);

    // Check for conflicts
    const hasConflict = this.hasTimeConflict(lunchStart, lunchEnd, existingEvents);
    
    if (!hasConflict) {
      return this.createHealthBreakEvent('lunch', lunchStart, lunchEnd, '🍽️ Lunch Break');
    }

    // Try alternative times within flexibility window
    const flexibilityMinutes = preferences.lunchFlexibility;
    for (let offset = 15; offset <= flexibilityMinutes; offset += 15) {
      // Try earlier
      const earlierStart = new Date(lunchStart.getTime() - offset * 60 * 1000);
      const earlierEnd = new Date(earlierStart.getTime() + preferences.lunchDuration * 60 * 1000);
      
      if (!this.hasTimeConflict(earlierStart, earlierEnd, existingEvents)) {
        return this.createHealthBreakEvent('lunch', earlierStart, earlierEnd, '🍽️ Lunch Break');
      }

      // Try later
      const laterStart = new Date(lunchStart.getTime() + offset * 60 * 1000);
      const laterEnd = new Date(laterStart.getTime() + preferences.lunchDuration * 60 * 1000);
      
      if (!this.hasTimeConflict(laterStart, laterEnd, existingEvents)) {
        return this.createHealthBreakEvent('lunch', laterStart, laterEnd, '🍽️ Lunch Break');
      }
    }

    // If no available time found, still create the break (user might need to resolve conflicts)
    return this.createHealthBreakEvent('lunch', lunchStart, lunchEnd, '🍽️ Lunch Break (Conflict)');
  }

  /**
   * Generate other meal breaks
   */
  private generateMealBreak(date: Date, mealType: string, timeString: string): CalendarEvent | null {
    const [hours, minutes] = timeString.split(':').map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30); // 30 min for breakfast/dinner

    const icon = mealType === 'breakfast' ? '🥐' : '🍽️';
    const title = `${icon} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;

    return this.createHealthBreakEvent(mealType, start, end, title);
  }

  /**
   * Create a health break event
   */
  private createHealthBreakEvent(breakType: string, start: Date, end: Date, title: string): CalendarEvent {
    return {
      id: `health-break-${breakType}-${start.toISOString()}`,
      title,
      start,
      end,
      type: 'meal_break',
      source: 'ai_generated',
      editable: true,
      priority: 'high', // Health breaks are high priority
      metadata: {
        aiSuggested: true,
        confidence: 0.95,
        energyLevel: 'medium'
      }
    };
  }

  /**
   * Generate AI wellness suggestions (lunch, walks, meditation breaks)
   */
  private generateWellnessBreaks(startDate: Date, endDate: Date, existingEvents: CalendarEvent[]): CalendarEvent[] {
    const wellnessEvents: CalendarEvent[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      // Only generate wellness breaks for weekdays (Monday-Friday)
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      const dayEvents = existingEvents.filter(event => {
        const eventDate = event.start.toISOString().split('T')[0];
        const currentDate = current.toISOString().split('T')[0];
        return eventDate === currentDate;
      });

      // 1. Lunch break (12:00 PM - 1:00 PM)
      const lunchStart = new Date(current);
      lunchStart.setHours(12, 0, 0, 0);
      const lunchEnd = new Date(lunchStart);
      lunchEnd.setHours(13, 0, 0, 0);

      if (!this.hasTimeConflict(lunchStart, lunchEnd, dayEvents)) {
        wellnessEvents.push({
          id: `wellness-lunch-${current.toISOString().split('T')[0]}`,
          title: '🍽️ Lunch Break',
          start: lunchStart,
          end: lunchEnd,
          type: 'wellness_break',
          source: 'ai_generated',
          editable: true,
          priority: 'medium',
          metadata: {
            aiSuggested: true,
            confidence: 0.9,
            energyLevel: 'medium'
          }
        });
      }

      // 2. Morning walk (10:30 AM - 10:35 AM)
      const morningWalkStart = new Date(current);
      morningWalkStart.setHours(10, 30, 0, 0);
      const morningWalkEnd = new Date(morningWalkStart);
      morningWalkEnd.setMinutes(morningWalkEnd.getMinutes() + 5);

      if (!this.hasTimeConflict(morningWalkStart, morningWalkEnd, dayEvents)) {
        wellnessEvents.push({
          id: `wellness-walk-morning-${current.toISOString().split('T')[0]}`,
          title: '🚶 Morning Walk',
          start: morningWalkStart,
          end: morningWalkEnd,
          type: 'wellness_break',
          source: 'ai_generated',
          editable: true,
          priority: 'low',
          metadata: {
            aiSuggested: true,
            confidence: 0.8,
            energyLevel: 'high'
          }
        });
      }

      // 3. Afternoon walk (3:00 PM - 3:05 PM)
      const afternoonWalkStart = new Date(current);
      afternoonWalkStart.setHours(15, 0, 0, 0);
      const afternoonWalkEnd = new Date(afternoonWalkStart);
      afternoonWalkEnd.setMinutes(afternoonWalkEnd.getMinutes() + 5);

      if (!this.hasTimeConflict(afternoonWalkStart, afternoonWalkEnd, dayEvents)) {
        wellnessEvents.push({
          id: `wellness-walk-afternoon-${current.toISOString().split('T')[0]}`,
          title: '🚶 Afternoon Walk',
          start: afternoonWalkStart,
          end: afternoonWalkEnd,
          type: 'wellness_break',
          source: 'ai_generated',
          editable: true,
          priority: 'low',
          metadata: {
            aiSuggested: true,
            confidence: 0.8,
            energyLevel: 'high'
          }
        });
      }

      // 4. Meditation break (2:15 PM - 2:20 PM)
      const meditationStart = new Date(current);
      meditationStart.setHours(14, 15, 0, 0);
      const meditationEnd = new Date(meditationStart);
      meditationEnd.setMinutes(meditationEnd.getMinutes() + 5);

      if (!this.hasTimeConflict(meditationStart, meditationEnd, dayEvents)) {
        wellnessEvents.push({
          id: `wellness-meditation-${current.toISOString().split('T')[0]}`,
          title: '🧘 Meditation Break',
          start: meditationStart,
          end: meditationEnd,
          type: 'wellness_break',
          source: 'ai_generated',
          editable: true,
          priority: 'low',
          metadata: {
            aiSuggested: true,
            confidence: 0.7,
            energyLevel: 'low'
          }
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return wellnessEvents;
  }

  /**
   * Check if a time slot conflicts with existing events
   */
  private hasTimeConflict(start: Date, end: Date, events: CalendarEvent[]): boolean {
    return events.some(event => 
      // Skip other health breaks when checking conflicts
      event.type !== 'meal_break' && event.type !== 'health_break' && event.type !== 'wellness_break' &&
      (start < event.end && end > event.start)
    );
  }

  /**
   * Add buffer time between events
   */
  addBufferTime(events: CalendarEvent[], bufferMinutes: number = 15): CalendarEvent[] {
    const bufferedEvents: CalendarEvent[] = [];
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];

      bufferedEvents.push(event);

      // Add buffer between consecutive events
      if (nextEvent && event.type !== 'meal_break' && nextEvent.type !== 'meal_break') {
        const timeBetween = (nextEvent.start.getTime() - event.end.getTime()) / (1000 * 60);
        
        if (timeBetween < bufferMinutes) {
          const bufferStart = new Date(event.end);
          const bufferEnd = new Date(nextEvent.start);
          
          bufferedEvents.push({
            id: `buffer-${event.id}-${nextEvent.id}`,
            title: `⏰ Buffer Time`,
            start: bufferStart,
            end: bufferEnd,
            type: 'health_break',
            source: 'ai_generated',
            editable: true,
            metadata: { aiSuggested: true }
          });
        }
      }
    }

    return bufferedEvents;
  }

  /**
   * Shift all events after a certain time
   */
  shiftEventsAfterTime(events: CalendarEvent[], afterTime: Date, shiftMinutes: number): CalendarEvent[] {
    return events.map(event => {
      if (event.start >= afterTime && event.source === 'ai_generated' && event.editable) {
        return {
          ...event,
          start: new Date(event.start.getTime() + shiftMinutes * 60 * 1000),
          end: new Date(event.end.getTime() + shiftMinutes * 60 * 1000)
        };
      }
      return event;
    });
  }

  /**
   * Check if this is a progress note task that needs special handling
   */
  private isProgressNote(task: Task): boolean {
    return task.tags?.includes('progress-note') ||
           task.tags?.includes('therapy') ||
           task.tags?.includes('documentation') ||
           task.title.toLowerCase().includes('progress note') ||
           task.title.toLowerCase().includes('clinical') ||
           task.title.toLowerCase().includes('therapy note');
  }

  /**
   * Reset/clear all AI suggestions for a fresh start
   */
  async resetAISuggestions(): Promise<void> {
    console.log('🤖 Resetting AI suggestions - clearing all pending and old suggestions');
    
    try {
      const user = getCustomAuthUser();
      if (!user?.id) {
        console.error('🤖 Cannot reset - user not authenticated');
        return;
      }

      // Get all tasks to clear their work session scheduling
      const tasks = await tasksService.getAll();
      console.log(`🤖 Found ${tasks.length} tasks to potentially reset`);

      // Clear work_session_scheduled_start for all tasks that have it
      const tasksToReset = tasks.filter(task => !!task.work_session_scheduled_start);
      console.log(`🤖 Resetting work sessions for ${tasksToReset.length} tasks`);

      for (const task of tasksToReset) {
        console.log(`🤖 Clearing work session for task: "${task.title}"`);
        await tasksService.update(task.id, {
          work_session_scheduled_start: undefined,
          work_session_scheduled_end: undefined
        });
      }

      console.log('🤖 ✅ Reset complete - all work sessions cleared');
    } catch (error) {
      console.error('🤖 Error during reset:', error);
    }
  }

  /**
   * Generate AI suggestions for scheduling unscheduled tasks
   */
  private async generateAIScheduleSuggestions(tasks: Task[], existingEvents: CalendarEvent[]): Promise<AIScheduleSuggestion[]> {
    const suggestions: AIScheduleSuggestion[] = [];
    const now = new Date();
    
    console.log('🤖 AI SUGGESTIONS DEBUG - Starting fresh generation with:', {
      totalTasks: tasks.length,
      totalEvents: existingEvents.length
    });
    
    // Debug all tasks to understand filtering
    console.log('🤖 DEBUG - All tasks received:', tasks.map(t => ({
      title: t.title,
      status: t.status,
      estimated_hours: t.estimated_hours,
      work_session_scheduled_start: t.work_session_scheduled_start,
      id: t.id
    })));
    
    // Find tasks that need work sessions scheduled
    const unscheduledTasks = tasks.filter(task => {
      const hasWorkSession = !!task.work_session_scheduled_start;
      const isCompleted = task.status === TaskStatus.COMPLETED;
      const hasEstimatedHours = task.estimated_hours > 0;
      
      const shouldInclude = !hasWorkSession && !isCompleted && hasEstimatedHours;
      
      // Debug all tasks to see what's happening
      console.log(`🤖 Task "${task.title}": ${shouldInclude ? 'INCLUDED' : 'EXCLUDED'}`, {
        hasWorkSession,
        isCompleted,
        hasEstimatedHours,
        estimatedHours: task.estimated_hours,
        isProgressNote: this.isProgressNote(task),
        status: task.status,
        workSessionStart: task.work_session_scheduled_start
      });
      
      return shouldInclude;
    });
    
    console.log('🤖 AI SUGGESTIONS DEBUG - Found unscheduled tasks:', unscheduledTasks.length);

    for (const task of unscheduledTasks) {
      console.log(`🤖 Generating suggestion for task: "${task.title}"`);
      
      // Check if this is a progress note with a corresponding counseling session
      if (this.isProgressNote(task)) {
        const suggestion = await this.generateProgressNoteScheduleSuggestion(task, existingEvents);
        if (suggestion && suggestion.suggestedStart > now) {
          suggestions.push(suggestion);
        }
      } else {
        const suggestion = await this.generateTaskScheduleSuggestion(task, existingEvents);
        if (suggestion) {
          console.log(`🤖 Generated suggestion:`, {
            taskTitle: suggestion.taskTitle,
            suggestedStart: suggestion.suggestedStart,
            isFuture: suggestion.suggestedStart > now
          });
          // Only include suggestions that are in the future (cleanup old suggestions)
          if (suggestion.suggestedStart > now) {
            suggestions.push(suggestion);
          }
        } else {
          console.log(`🤖 No suggestion generated for task: "${task.title}"`);
        }
      }
    }

    console.log('🤖 AI SUGGESTIONS DEBUG - Final suggestions count:', suggestions.length);
    return suggestions;
  }

  /**
   * Generate a schedule suggestion specifically for progress notes (must be after counseling session)
   */
  private async generateProgressNoteScheduleSuggestion(task: Task, existingEvents: CalendarEvent[]): Promise<AIScheduleSuggestion | null> {
    try {
      console.log(`🤖 Scheduling progress note: "${task.title}"`);
      
      // Extract date from progress note title (format: "Progress Note - YYYY-MM-DD")
      const dateMatch = task.title.match(/Progress Note.*(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) {
        console.log(`🤖 Could not extract date from progress note title`);
        return null;
      }
      
      const progressNoteDate = new Date(dateMatch[1]);
      
      // Find counseling sessions on the same date
      const counselingSessions = existingEvents.filter(event => 
        (event.type === 'counseling_session' || event.type === 'event') &&
        event.title.toLowerCase().includes('counseling') &&
        event.start.toDateString() === progressNoteDate.toDateString()
      );
      
      if (counselingSessions.length === 0) {
        console.log(`🤖 No counseling session found for progress note date: ${progressNoteDate.toDateString()}`);
        return null;
      }
      
      // Find the latest counseling session on that day
      const latestCounseling = counselingSessions.reduce((latest, session) => 
        session.end > latest.end ? session : latest
      );
      
      console.log(`🤖 Counseling session ends at: ${latestCounseling.end.toLocaleString()}`);
      
      // Schedule progress note for 30 minutes after the counseling session ends
      const suggestedStart = new Date(latestCounseling.end.getTime() + 30 * 60 * 1000);
      const sessionDuration = Math.min(task.estimated_hours || 0.5, 1) * 60 * 60 * 1000; // Max 1 hour for progress notes
      const suggestedEnd = new Date(suggestedStart.getTime() + sessionDuration);
      
      // Check if this time slot conflicts with other events
      const conflictingEvents = existingEvents.filter(event => 
        (suggestedStart < event.end && suggestedEnd > event.start)
      );
      
      if (conflictingEvents.length > 0) {
        console.log(`🤖 Progress note slot conflicts with existing events, looking for next available time`);
        // Try to find next available slot after the counseling session
        return this.findNextAvailableSlotAfter(task, suggestedStart, existingEvents);
      }
      
      console.log(`🤖 ✅ Progress note scheduled: ${suggestedStart.toLocaleString()}`);
      
      return {
        id: `suggestion-${task.id}-${Date.now()}`,
        taskId: task.id,
        taskTitle: task.title,
        taskPriority: task.priority,
        taskProject: task.project_id,
        suggestedStart,
        suggestedEnd,
        confidence: 0.95, // High confidence for post-session progress notes
        reasoning: `Scheduled after counseling session on ${progressNoteDate.toLocaleDateString()} (${latestCounseling.end.toLocaleTimeString()} + 30 min buffer)`,
        status: 'pending'
      };
      
    } catch (error) {
      console.error('Error generating progress note suggestion:', error);
      return null;
    }
  }

  /**
   * Find next available time slot after a given time
   */
  private async findNextAvailableSlotAfter(task: Task, afterTime: Date, existingEvents: CalendarEvent[]): Promise<AIScheduleSuggestion | null> {
    const sessionDuration = Math.min(task.estimated_hours || 0.5, 1) * 60 * 60 * 1000;
    
    // Try every 30 minutes for the next 4 hours
    for (let offset = 0; offset < 4 * 60; offset += 30) {
      const slotStart = new Date(afterTime.getTime() + offset * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + sessionDuration);
      
      // Don't schedule too late in the evening
      if (slotStart.getHours() >= 18) {
        break;
      }
      
      const conflicts = existingEvents.filter(event => 
        (slotStart < event.end && slotEnd > event.start)
      );
      
      if (conflicts.length === 0) {
        console.log(`🤖 ✅ Found alternative slot: ${slotStart.toLocaleString()}`);
        return {
          id: `suggestion-${task.id}-${Date.now()}`,
          taskId: task.id,
          taskTitle: task.title,
          taskPriority: task.priority,
          taskProject: task.project_id,
          suggestedStart: slotStart,
          suggestedEnd: slotEnd,
          confidence: 0.8,
          reasoning: `Scheduled after counseling session with buffer time`,
          status: 'pending'
        };
      }
    }
    
    return null;
  }

  /**
   * Generate a schedule suggestion for a specific task
   */
  private async generateTaskScheduleSuggestion(task: Task, existingEvents: CalendarEvent[]): Promise<AIScheduleSuggestion | null> {
    try {
      // Simple scheduling algorithm - find next available time slot
      const now = new Date();
      const workingHoursStart = 9; // 9 AM
      const workingHoursEnd = 17; // 5 PM
      const sessionDuration = Math.min(task.estimated_hours, 4) * 60 * 60 * 1000; // Max 4 hours per session

      console.log(`🤖 Scheduling "${task.title}" (${task.estimated_hours}h, due: ${task.due_date})`);

      // Start looking from the next available time (either now if it's during work hours, or tomorrow morning)
      let startLookingFrom = new Date(now);
      
      // If it's currently outside work hours or weekend, start from next business day at 8 AM
      const currentHour = now.getHours();
      const isCurrentlyWeekend = now.getDay() === 0 || now.getDay() === 6;
      const isAfterHours = currentHour < workingHoursStart || currentHour >= workingHoursEnd;
      
      if (isCurrentlyWeekend || isAfterHours) {
        // Find next business day
        startLookingFrom = new Date(now);
        startLookingFrom.setDate(startLookingFrom.getDate() + 1);
        
        // If it's weekend, advance to Monday
        while (startLookingFrom.getDay() === 0 || startLookingFrom.getDay() === 6) {
          startLookingFrom.setDate(startLookingFrom.getDate() + 1);
        }
        
        // Set to 8 AM
        startLookingFrom.setHours(workingHoursStart, 0, 0, 0);
      } else {
        // Start from current time but round up to next hour
        startLookingFrom.setMinutes(0, 0, 0);
        startLookingFrom.setHours(startLookingFrom.getHours() + 1);
      }
      
      console.log(`🤖 Looking for slots from: ${startLookingFrom.toLocaleString()}`);
      console.log(`🤖 Existing events to check conflicts against:`, existingEvents.map(e => ({
        title: e.title,
        start: e.start.toLocaleString(),
        end: e.end.toLocaleString(),
        source: e.source,
        type: e.type,
        editable: e.editable
      })));

      // Find available slot within the next 7 days
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDate = new Date(startLookingFrom);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        
        // Enhanced context-aware scheduling with strict business/personal separation
        const isCheckDateWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;
        
        
        // Strict context separation: never mix business and personal inappropriately
        // Handle 'inherited' context by treating it as flexible (can be scheduled anytime)
        if (task.task_context === 'business') {
          // Business tasks should only be suggested for:
          // 1. Weekdays during business hours
          // 2. Future weekdays (can suggest Monday tasks on weekend, but for Monday morning)
          if (isCheckDateWeekend) {
            continue; // Never suggest business tasks for weekends
          }
        } else if (task.task_context === 'personal') {
          // Personal tasks should only be suggested for:
          // 1. Weekends (any time)
          // 2. Weekday evenings (after business hours)
          // 3. Early mornings before business hours
          if (!isCheckDateWeekend) {
            // On weekdays, we'll filter by hour in the inner loop
            // This allows us to check each specific time slot
          }
        } else {
          // 'inherited' or undefined context - flexible scheduling
        }

        // Check each hour slot during working hours
        for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
          const slotStart = new Date(checkDate);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + sessionDuration);
          
          console.log(`🤖 Checking slot: ${slotStart.toLocaleString()} - ${slotEnd.toLocaleString()}`);


          // Apply hour-based context filtering
          if (task.task_context === 'business') {
            // Don't suggest business tasks for evening slots (after 5 PM) 
            if (hour >= 17) {
              continue; // Business tasks shouldn't be suggested for evenings
            }
          } else if (task.task_context === 'personal') {
            // On weekdays, only suggest personal tasks outside business hours
            if (!isCheckDateWeekend && hour >= 9 && hour < 17) {
              continue; // Don't suggest personal tasks during business hours
            }
          }
          // 'inherited' or undefined context - no hour restrictions

          // Check if slot conflicts with existing events
          // AI can override its own suggestions but not user-created events
          const conflictingEvents = existingEvents.filter(event => 
            (slotStart < event.end && slotEnd > event.start)
          );
          
          // Filter out AI-generated events that can be overridden
          const nonOverridableConflicts = conflictingEvents.filter(event => {
            // AI can override its own suggestions and wellness breaks
            const canOverride = event.source === 'ai_generated' || 
                               event.type === 'wellness_break' || 
                               event.type === 'health_break' ||
                               (event.source === 'manual' && event.editable);
            
            console.log(`🤖 Conflict check: "${event.title}" (${event.source}, ${event.type}) - Can override: ${canOverride}`);
            return !canOverride;
          });
          
          const hasConflict = nonOverridableConflicts.length > 0;
          
          if (conflictingEvents.length > 0 && !hasConflict) {
            console.log(`🤖 ⚠️ Overriding AI suggestions: ${conflictingEvents.map(e => e.title).join(', ')}`);
          }

          if (!hasConflict) {
            console.log(`🤖 ✅ Found slot: ${slotStart.toLocaleString()}`);
            // Calculate confidence based on various factors
            const confidence = this.calculateScheduleConfidence(task, slotStart, existingEvents);
            
            return {
              id: `suggestion-${task.id}-${Date.now()}`,
              taskId: task.id,
              taskTitle: task.title,
              taskPriority: task.priority,
              taskProject: task.project_id,
              suggestedStart: slotStart,
              suggestedEnd: slotEnd,
              confidence,
              reasoning: this.generateSchedulingReasoning(task, slotStart, confidence),
              status: 'pending'
            };
          }
        }
      }

      console.log(`🤖 No available slots found for task "${task.title}" in next 7 days`);
      return null; // No available slot found
    } catch (error) {
      console.error('Error generating schedule suggestion for task:', task.id, error);
      return null;
    }
  }

  /**
   * Calculate confidence score for a suggested schedule
   */
  private calculateScheduleConfidence(task: Task, suggestedStart: Date, existingEvents: CalendarEvent[]): number {
    let confidence = 0.7; // Base confidence

    // Factor in task priority (higher priority = higher confidence)
    const priorityBonus: Record<string, number> = {
      'urgent': 0.2,
      'high': 0.15,
      'medium': 0.1,
      'low': 0.05
    };
    confidence += priorityBonus[task.priority || 'medium'] || 0;

    // Factor in time until due date
    if (task.due_date) {
      const daysUntilDue = (new Date(task.due_date).getTime() - suggestedStart.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntilDue < 1) confidence += 0.15; // Due soon
      else if (daysUntilDue < 3) confidence += 0.1;
    }

    // Factor in energy level matching (assume morning = high energy)
    const hour = suggestedStart.getHours();
    if (task.energy_level === 'high' && hour >= 8 && hour <= 11) {
      confidence += 0.1;
    } else if (task.energy_level === 'low' && hour >= 14 && hour <= 16) {
      confidence += 0.05;
    }

    // Penalize if there are nearby conflicting events
    const nearbyEvents = existingEvents.filter(event => {
      const timeDiff = Math.abs(event.start.getTime() - suggestedStart.getTime());
      return timeDiff < 2 * 60 * 60 * 1000; // Within 2 hours
    });
    confidence -= nearbyEvents.length * 0.05;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Generate human-readable reasoning for scheduling suggestion
   */
  private generateSchedulingReasoning(task: Task, suggestedStart: Date, confidence: number): string {
    const reasons: string[] = [];
    
    const hour = suggestedStart.getHours();
    const fullDate = suggestedStart.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric',
      year: suggestedStart.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    const currentDay = new Date().getDay();
    const isCurrentlyWeekend = currentDay === 0 || currentDay === 6;
    const isSuggestedWeekend = suggestedStart.getDay() === 0 || suggestedStart.getDay() === 6;
    
    reasons.push(`Scheduled for ${fullDate} at ${suggestedStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`);
    
    // Context-aware reasoning
    if (isCurrentlyWeekend && task.task_context === 'personal') {
      reasons.push('Personal time - perfect for personal tasks');
    } else if (isCurrentlyWeekend && task.task_context === 'business' && !isSuggestedWeekend) {
      reasons.push('Business task scheduled for upcoming work day');
    } else if (!isCurrentlyWeekend && task.task_context === 'business' && !isSuggestedWeekend) {
      reasons.push('Work day focus time for business task');
    }
    
    if (task.energy_level === 'high' && hour >= 8 && hour <= 11) {
      reasons.push('Morning slot matches high energy requirement');
    }
    
    if (task.due_date) {
      const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - suggestedStart.getTime()) / (1000 * 60 * 60 * 24));
      reasons.push(`${daysUntilDue} days before due date`);
    }
    
    if (confidence > 0.8) {
      reasons.push('High confidence - optimal time slot');
    } else if (confidence < 0.5) {
      reasons.push('Lower confidence - consider manual adjustment');
    }
    
    return reasons.join('. ');
  }

  /**
   * Helper methods for date filtering
   */
  private filterTasksByDateRange(tasks: Task[], startDate: Date, endDate: Date): Task[] {
    return tasks.filter(task => {
      // Include tasks with due dates in range
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        if (dueDate >= startDate && dueDate <= endDate) return true;
      }
      
      // Include tasks with scheduled work sessions in range
      if (task.work_session_scheduled_start) {
        const workStart = new Date(task.work_session_scheduled_start);
        if (workStart >= startDate && workStart <= endDate) return true;
      }
      
      return false;
    });
  }

  private filterSchedulesByDateRange(schedules: Schedule[], startDate: Date, endDate: Date): Schedule[] {
    return schedules.filter(schedule => {
      const scheduleStart = new Date(schedule.start_date);
      const scheduleEnd = new Date(schedule.end_date);
      
      // Include if schedule overlaps with date range
      return scheduleStart <= endDate && scheduleEnd >= startDate;
    });
  }

  // Temporarily disabled - will re-enable when daily_schedules table is properly configured
  // private async getDailySchedulesInRange(startDate: Date, endDate: Date): Promise<DailySchedule[]> {
  //   const schedules: DailySchedule[] = [];
  //   const currentDate = new Date(startDate);
  //   
  //   while (currentDate <= endDate) {
  //     const dateStr = currentDate.toISOString().split('T')[0];
  //     try {
  //       const schedule = await dailyScheduleService.getDailySchedule(dateStr);
  //       if (schedule) {
  //         schedules.push(schedule);
  //       }
  //     } catch (error) {
  //       console.warn(`Failed to fetch daily schedule for ${dateStr}:`, error);
  //     }
  //     currentDate.setDate(currentDate.getDate() + 1);
  //   }
  //   
  //   return schedules;
  // }

  /**
   * Apply AI suggestion (approve and schedule the work session)
   */
  async applySuggestion(suggestion: AIScheduleSuggestion): Promise<void> {
    try {
      const user = getCustomAuthUser();
      if (!user?.id) throw new Error('User not authenticated');

      let taskId = suggestion.taskId;
      let task = null;
      if (taskId) {
        // Try to fetch the task
        task = await tasksService.getById(taskId);
      }
      if (!task) {
        // Create a new task from the suggestion
        const newTask = await tasksService.create({
          title: suggestion.taskTitle,
          context: '',
          priority: (suggestion.taskPriority || 'medium') as import('../../types').TaskPriority,
          status: 'todo' as import('../../types').TaskStatus,
          estimated_hours: 1, // Default to 1 if not provided
          dependencies: [],
          tags: [],
          project_id: suggestion.taskProject,
          due_date: suggestion.suggestedEnd ? suggestion.suggestedEnd.toISOString().split('T')[0] : undefined,
          task_context: undefined,
          energy_level: undefined,
          notes: undefined,
          completion_notes: undefined,
        });
        taskId = newTask.id;
      }

      // Schedule the work session for the (new or existing) task
      await tasksService.scheduleWorkSession(
        taskId,
        suggestion.suggestedStart,
        suggestion.suggestedEnd,
        true // Mark as AI suggested
      );

      console.log('Applied AI scheduling suggestion:', suggestion.id);
    } catch (error) {
      console.error('Error applying AI suggestion:', error);
      throw error;
    }
  }

  /**
   * Deny AI suggestion
   */
  async denySuggestion(suggestionId: string): Promise<void> {
    // For now, just log the denial
    // In the future, this could store denial reasons for AI learning
    console.log('Denied AI scheduling suggestion:', suggestionId);
  }

  /**
   * Pencil in an AI suggestion (mark as fixed, AI won't move it)
   */
  async pencilInSuggestion(suggestion: AIScheduleSuggestion): Promise<void> {
    try {
      console.log('📌 Penciling in suggestion:', suggestion.taskTitle);
      
      // Store penciled in suggestion in localStorage for now
      const penciledSuggestions = this.getPenciledSuggestions();
      penciledSuggestions.set(suggestion.id, {
        suggestionId: suggestion.id,
        taskId: suggestion.taskId,
        timeSlot: {
          start: suggestion.suggestedStart,
          end: suggestion.suggestedEnd
        },
        penciledAt: new Date(),
        confidence: 'locked'
      });
      
      this.savePenciledSuggestions(penciledSuggestions);
      console.log('📌 Suggestion penciled in successfully');
    } catch (error) {
      console.error('Error penciling in suggestion:', error);
      throw error;
    }
  }

  /**
   * Unpencil a suggestion (allow AI to move it again)
   */
  async unpencilSuggestion(suggestionId: string): Promise<void> {
    try {
      console.log('📌 Unpenciling suggestion:', suggestionId);
      
      const penciledSuggestions = this.getPenciledSuggestions();
      penciledSuggestions.delete(suggestionId);
      this.savePenciledSuggestions(penciledSuggestions);
      
      console.log('📌 Suggestion unpenciled successfully');
    } catch (error) {
      console.error('Error unpenciling suggestion:', error);
      throw error;
    }
  }

  /**
   * Check if a suggestion is penciled in
   */
  isSuggestionPenciledIn(suggestionId: string): boolean {
    const penciledSuggestions = this.getPenciledSuggestions();
    return penciledSuggestions.has(suggestionId);
  }

  /**
   * Get penciled suggestions from localStorage
   */
  private getPenciledSuggestions(): Map<string, any> {
    try {
      const stored = localStorage.getItem('penciledSuggestions');
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Error loading penciled suggestions:', error);
    }
    return new Map();
  }

  /**
   * Save penciled suggestions to localStorage
   */
  private savePenciledSuggestions(penciledSuggestions: Map<string, any>): void {
    try {
      const obj = Object.fromEntries(penciledSuggestions);
      localStorage.setItem('penciledSuggestions', JSON.stringify(obj));
    } catch (error) {
      console.warn('Error saving penciled suggestions:', error);
    }
  }

  /**
   * Apply suggestions with feedback for modification
   */
  async applySuggestionsWithFeedback(suggestions: AIScheduleSuggestion[], feedback: string): Promise<void> {
    console.log('Applying AI suggestions with feedback:', suggestions.length, 'suggestions with feedback:', feedback);
    
    for (const suggestion of suggestions) {
      await this.applySuggestion(suggestion);
    }
    
    // In a real implementation, this would:
    // 1. Apply the suggestions to create work sessions
    // 2. Send the feedback to AI for future improvements
    // 3. Update the AI model's understanding of user preferences
  }

  /**
   * Request new AI plan with feedback
   */
  async requestNewPlanWithFeedback(feedback: string, commonIssues: string[]): Promise<void> {
    console.log('Requesting new AI plan with feedback:', feedback, 'Common issues:', commonIssues);
    
    // In a real implementation, this would:
    // 1. Send feedback and common issues to AI service
    // 2. Request generation of new schedule suggestions
    // 3. Replace current pending suggestions with new ones
    // 4. Update the database with new suggestions
  }
}

// Export singleton instance
export const calendarIntegrationService = new CalendarIntegrationService();