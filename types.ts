
// Basic Status & Priority Enums
export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on-hold',
}

export enum ProjectContext {
  BUSINESS = 'business',
  PERSONAL = 'personal',
  HYBRID = 'hybrid',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

// Universal Sync Fields (Optional)
export interface UniversalSyncFields {
  created_by?: string; // Device ID or User ID
  last_modified_by?: string; // Device ID or User ID
  version?: number;
  sync_status?: 'new' | 'modified' | 'synced' | 'conflict';
}

// Core Entities
export interface Project extends UniversalSyncFields {
  id: string;
  title: string;
  description?: string;
  context: string; // AI context - detailed description for AI understanding
  goals: string[];
  deadline?: string; // DateTime
  status: ProjectStatus;
  project_context: ProjectContext; // business/personal/hybrid classification
  tags: string[];
  business_relevance?: number;
  preferred_time_slots?: string[];
  created_at?: string; // DateTime
  updated_at?: string; // DateTime
  user_id?: string; // For RLS
}

export interface Task extends UniversalSyncFields {
  id: string;
  project_id?: string; // Reference to projects.id
  title: string;
  description?: string;
  context: string; // AI context - detailed description for AI understanding
  priority: TaskPriority;
  estimated_hours: number; // Float
  status: TaskStatus;
  progress?: number; // 0-100 percentage of task completion
  dependencies: string[]; // JSON array of task IDs
  due_date?: string; // DateTime
  deadline?: string;
  tags: string[];
  category?: string;
  task_context?: 'personal' | 'business' | 'inherited';
  energy_level?: 'low' | 'medium' | 'high';
  notes?: string;
  completion_notes?: string;
  work_session_scheduled_start?: string; // DateTime for scheduled work session
  work_session_scheduled_end?: string; // DateTime for scheduled work session
  ai_suggested?: boolean; // Whether work session was suggested by AI
  scheduled_start?: string; // DateTime for user-scheduled task time
  scheduled_end?: string; // DateTime for user-scheduled task time
  is_time_blocked?: boolean; // Whether this task blocks time on the calendar
  created_at?: string; // DateTime
  updated_at?: string; // DateTime
  user_id?: string; // For RLS
}

export type AIProvider = 'claude' | 'openai' | 'gemini'; // gemini deprecated but kept for backward compatibility

export interface UserPreferences {
  id: string; // CUID
  user_id: string; // Foreign key to auth.users
  working_hours_start: string; // 'HH:MM'
  working_hours_end: string; // 'HH:MM'
  focus_block_duration: number; // minutes
  break_duration: number; // minutes
  priority_weight_deadline: number; // float
  priority_weight_effort: number; // float
  priority_weight_deps: number; // float
  instructions?: string; // Markdown
  business_hours_start?: string; // 'HH:MM'
  business_hours_end?: string; // 'HH:MM'
  business_days?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  personal_time_weekday_evening?: boolean;
  personal_time_weekends?: boolean;
  personal_time_early_morning?: boolean;
  allow_business_in_personal_time?: boolean;
  allow_personal_in_business_time?: boolean;
  context_switch_buffer_minutes?: number;
  ai_provider: AIProvider;
  selected_gemini_model: string;
  gemini_api_key?: string;
  claude_api_key?: string;
  selected_claude_model?: string;
  openai_api_key?: string;
  selected_openai_model?: string;
  focus_blocks?: string[];
  preferred_time_slots?: string[];
  business_relevance_default?: number;
  created_at?: string; // DateTime
  updated_at?: string; // DateTime
}

export interface Tag {
  id: string; // CUID
  name: string;
  color?: string;
  description?: string;
  category_id: string; // FK to TagCategory
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string; // if tags are user-specific
}

export interface TagCategory {
  id: string; // CUID
  name: string;
  label: string;
  color?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string; // if categories are user-specific
}

export interface Note extends UniversalSyncFields {
  id: string; // CUID
  project_id: string; // FK to Project
  title: string;
  content: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface Schedule extends UniversalSyncFields {
  id: string; // UUID
  task_id?: string; // FK to Task - schedules are linked to tasks, not projects directly
  title: string;
  context?: string; // Description/notes about the event
  start_date: string; // DateTime
  end_date: string; // DateTime
  all_day?: boolean;
  event_type?: 'meeting' | 'appointment' | 'deadline' | 'personal' | 'other';
  location?: string;
  recurring?: string; // JSON object for recurrence rule
  reminders?: string; // JSON array of reminders
  blocks_work_time?: boolean; // Whether this event blocks time for task scheduling
  tags: string[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

// Alias for better semantic meaning
export type CalendarEvent = Schedule;

export interface DocumentFile extends UniversalSyncFields {
  id: string; // CUID
  project_id?: string; // FK to Project, NULLABLE
  title: string;
  type: 'image' | 'pdf' | 'text' | 'other';
  content?: string;
  file_path?: string;
  mime_type?: string;
  size?: number; // in bytes
  tags: string[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface Plan extends UniversalSyncFields {
  id: string; // CUID
  content: string;
  date: string; // DateTime, date of the plan
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface DailySchedule extends UniversalSyncFields {
  id: string; // UUID
  user_id: string;
  schedule_date: string; // Date string (YYYY-MM-DD)
  schedule_text: string; // Markdown formatted schedule
  schedule_type: 'business' | 'personal' | 'mixed';
  created_at?: string; // DateTime
  updated_at?: string; // DateTime
}

// Workspace Snapshot Components
export interface EnrichedProject extends Project {
  completion_percentage: number;
  active_tasks_count: number;
  total_tasks_count: number;
  urgency_score?: number;
}

export interface PriorityGroups {
  urgent: Task[];
  high: Task[];
  medium: Task[];
  low: Task[];
}

export interface TagUsage {
  tag: string;
  count: number;
  related_project_ids: string[];
  related_task_ids: string[];
}
export interface TagPatterns {
  all_tags_with_usage: TagUsage[];
  most_frequent_tags: TagUsage[];
}

export interface UrgencyMetrics {
  overdue_tasks_count: number;
  tasks_due_soon_count: number; // e.g. next 7 days
  upcoming_deadlines: Array<{ entity_id: string, entity_title: string, deadline: string, type: 'project' | 'task' | 'schedule' }>;
}

export interface TimeMetrics {
  total_estimated_hours_all_tasks: number;
  total_estimated_hours_completed_tasks: number;
  total_estimated_hours_pending_tasks: number;
  average_task_estimation: number;
}

export interface BlockedTask {
  task_id: string;
  task_title: string;
  blocking_task_ids: string[];
  blocking_task_titles: string[];
  reason: string;
}

export interface ProjectAttentionItem {
  project_id: string;
  project_title: string;
  reason: string;
}

export interface StrategicInsights {
  blocked_tasks: BlockedTask[];
  projects_needing_attention: ProjectAttentionItem[];
  focus_recommendations: string[];
  priority_balance_score: number; // 0-100
}

export interface WorkspaceSnapshot {
  metadata: {
    export_date: string;
    app_version: string;
    user_preferences: UserPreferences;
  };
  projects: EnrichedProject[];
  tasks_by_priority: PriorityGroups;
  all_tasks: Task[];
  tag_analysis: TagPatterns;
  urgency_analysis: UrgencyMetrics;
  time_analysis: TimeMetrics;
  strategic_insights: StrategicInsights;
}
