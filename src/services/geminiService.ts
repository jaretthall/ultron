// Gemini service deprecated - keeping only type exports for backward compatibility
import { Project, Task, StrategicInsights, UserPreferences } from '../../types';

export const initializeGeminiService = (_apiKey: string) => {
  console.warn('Gemini service is deprecated and no longer supported');
  return false;
};

// Enhanced interfaces for new AI capabilities
export interface DailyPlan {
  date: string;
  recommended_schedule: ScheduledItem[];
  focus_blocks: FocusBlock[];
  energy_optimization: EnergyOptimization;
  workload_summary: WorkloadSummary;
  ai_recommendations: string[];
}

export interface ScheduledItem {
  task_id: string;
  task_title: string;
  suggested_start_time: string;
  suggested_duration_minutes: number;
  energy_match_score: number;
  context_match_score: number;
  priority_score: number;
  reasoning: string;
}

export interface FocusBlock {
  block_type: 'deep_work' | 'focused_execution' | 'creative' | 'analytical';
  start_time: string;
  duration_minutes: number;
  energy_level: 'high' | 'medium' | 'low';
  optimal_tasks: string[];
  description: string;
}

export interface EnergyOptimization {
  peak_hours: string[];
  low_energy_periods: string[];
  recommended_task_distribution: {
    high_energy_tasks: number;
    medium_energy_tasks: number;
    low_energy_tasks: number;
  };
  energy_efficiency_score: number;
}

export interface WorkloadSummary {
  total_scheduled_hours: number;
  available_capacity_hours: number;
  utilization_percentage: number;
  overload_risk: 'low' | 'medium' | 'high';
  bottlenecks: string[];
  recommendations: string[];
}

export interface WorkloadAnalysis {
  capacity_analysis: {
    current_workload_hours: number;
    available_capacity_hours: number;
    utilization_rate: number;
    burnout_risk_score: number;
    optimal_capacity_range: { min: number; max: number };
  };
  bottleneck_detection: {
    resource_bottlenecks: string[];
    dependency_bottlenecks: string[];
    skill_bottlenecks: string[];
    time_bottlenecks: string[];
    mitigation_strategies: string[];
  };
  work_life_balance: {
    business_hours_utilization: number;
    personal_time_protection: number;
    context_switching_frequency: number;
    balance_score: number;
    improvement_suggestions: string[];
  };
  efficiency_metrics: {
    task_completion_velocity: number;
    priority_alignment_score: number;
    energy_utilization_efficiency: number;
    focus_time_percentage: number;
    multitasking_overhead: number;
  };
  strategic_recommendations: string[];
}

// Deprecated functions - all return default values with deprecation warnings
export const generateStrategicInsights = async (
  _projects: Project[],
  _tasks: Task[],
  _userPreferences: UserPreferences
): Promise<StrategicInsights> => {
  console.warn('Gemini service is deprecated. Please use Claude or OpenAI instead.');
  return {
    blocked_tasks: [],
    projects_needing_attention: [],
    focus_recommendations: ['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.'],
    priority_balance_score: 0,
  };
};

export const generateDailyPlan = async (
  date: Date,
  _projects: Project[],
  _tasks: Task[],
  _userPreferences: UserPreferences,
  _focusBlockData?: any[]
): Promise<DailyPlan> => {
  console.warn('Gemini service is deprecated. Please use Claude or OpenAI instead.');
  return {
    date: date.toISOString().split('T')[0],
    recommended_schedule: [],
    focus_blocks: [],
    energy_optimization: {
      peak_hours: ['09:00', '10:30'],
      low_energy_periods: ['14:00', '15:30'],
      recommended_task_distribution: { high_energy_tasks: 2, medium_energy_tasks: 4, low_energy_tasks: 2 },
      energy_efficiency_score: 0
    },
    workload_summary: {
      total_scheduled_hours: 0,
      available_capacity_hours: 8,
      utilization_percentage: 0,
      overload_risk: 'low',
      bottlenecks: [],
      recommendations: ['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.']
    },
    ai_recommendations: ['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.']
  };
};

export const generateWorkloadAnalysis = async (
  _projects: Project[],
  _tasks: Task[],
  _userPreferences: UserPreferences,
  _schedulingData?: any
): Promise<WorkloadAnalysis> => {
  console.warn('Gemini service is deprecated. Please use Claude or OpenAI instead.');
  return {
    capacity_analysis: {
      current_workload_hours: 0,
      available_capacity_hours: 8,
      utilization_rate: 0,
      burnout_risk_score: 0,
      optimal_capacity_range: { min: 6, max: 8 }
    },
    bottleneck_detection: {
      resource_bottlenecks: [],
      dependency_bottlenecks: [],
      skill_bottlenecks: [],
      time_bottlenecks: [],
      mitigation_strategies: ['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.']
    },
    work_life_balance: {
      business_hours_utilization: 0,
      personal_time_protection: 100,
      context_switching_frequency: 0,
      balance_score: 50,
      improvement_suggestions: ['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.']
    },
    efficiency_metrics: {
      task_completion_velocity: 0,
      priority_alignment_score: 0,
      energy_utilization_efficiency: 0,
      focus_time_percentage: 0,
      multitasking_overhead: 0
    },
    strategic_recommendations: ['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.']
  };
};

export const getGeminiInsights = async (
  _projects: Project[],
  _tasks: Task[],
  _apiKey?: string
): Promise<StrategicInsights> => {
  console.warn('Gemini service is deprecated. Please use Claude or OpenAI instead.');
  return {
    blocked_tasks: [],
    projects_needing_attention: [],
    focus_recommendations: ['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.'],
    priority_balance_score: 0,
  };
};