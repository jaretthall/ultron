// Calendar Integration Service
// Merges tasks, events, schedules, and AI suggestions into unified calendar views
import { Task, Schedule, DailySchedule } from '../../types';
import { tasksService, schedulesService } from '../../services/databaseService';
import { getCustomAuthUser } from '../contexts/CustomAuthContext';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'deadline' | 'work_session' | 'event' | 'counseling_session';
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
        events.push({
          id: `deadline-${task.id}`,
          title: `📅 ${task.title} (Due)`,
          start: dueDate,
          end: dueDate,
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
    });

    return events;
  }

  /**
   * Convert schedule entries to calendar events
   */
  private convertSchedulesToEvents(schedules: Schedule[]): CalendarEvent[] {
    return schedules.map(schedule => ({
      id: `schedule-${schedule.id}`,
      title: schedule.title,
      start: new Date(schedule.start_date),
      end: new Date(schedule.end_date),
      type: schedule.event_type?.includes('counseling') ? 'counseling_session' : 'event',
      source: 'schedule',
      editable: false, // User-created events cannot be modified by AI
      scheduleId: schedule.id,
      taskId: schedule.task_id,
      metadata: {
        aiSuggested: false
      }
    }));
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
   * Generate AI suggestions for scheduling unscheduled tasks
   */
  private async generateAIScheduleSuggestions(tasks: Task[], existingEvents: CalendarEvent[]): Promise<AIScheduleSuggestion[]> {
    const suggestions: AIScheduleSuggestion[] = [];
    
    // Find tasks that need work sessions scheduled
    const unscheduledTasks = tasks.filter(task => 
      !task.work_session_scheduled_start && 
      task.status !== 'completed' && 
      task.estimated_hours > 0
    );

    for (const task of unscheduledTasks) {
      const suggestion = await this.generateTaskScheduleSuggestion(task, existingEvents);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Generate a schedule suggestion for a specific task
   */
  private async generateTaskScheduleSuggestion(task: Task, existingEvents: CalendarEvent[]): Promise<AIScheduleSuggestion | null> {
    try {
      // Simple scheduling algorithm - find next available time slot
      const now = new Date();
      const workingHoursStart = 8; // 8 AM
      const workingHoursEnd = 17; // 5 PM
      const sessionDuration = Math.min(task.estimated_hours, 4) * 60 * 60 * 1000; // Max 4 hours per session

      // Start looking from tomorrow if task is due soon, or from today if not urgent
      const startLookingFrom = task.due_date && new Date(task.due_date) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) 
        ? now 
        : new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find available slot within the next 7 days
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDate = new Date(startLookingFrom);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        
        // Context-aware scheduling based on current day
        const currentDay = new Date().getDay();
        const isWeekend = currentDay === 0 || currentDay === 6;
        const isCheckDateWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;
        
        // If it's currently weekend, suggest personal tasks for weekend and business for Monday
        if (isWeekend) {
          // On weekends, suggest personal tasks for today/tomorrow, business for Monday+
          if (task.task_context === 'business' && isCheckDateWeekend) {
            continue; // Skip business tasks on weekends when user is in personal time
          }
          if (task.task_context === 'personal' && !isCheckDateWeekend) {
            // Lower priority for personal tasks on weekdays when suggested from weekend
            continue;
          }
        } else {
          // On weekdays, suggest business tasks for weekdays, personal for evenings/weekends
          if (task.task_context === 'business' && isCheckDateWeekend) {
            continue; // Business tasks shouldn't be suggested for weekends
          }
        }

        // Check each hour slot during working hours
        for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
          const slotStart = new Date(checkDate);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + sessionDuration);

          // Check if slot conflicts with existing events
          const hasConflict = existingEvents.some(event => 
            (slotStart < event.end && slotEnd > event.start)
          );

          if (!hasConflict) {
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
    const dayName = suggestedStart.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDay = new Date().getDay();
    const isCurrentlyWeekend = currentDay === 0 || currentDay === 6;
    const isSuggestedWeekend = suggestedStart.getDay() === 0 || suggestedStart.getDay() === 6;
    
    reasons.push(`Scheduled for ${dayName} at ${suggestedStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`);
    
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