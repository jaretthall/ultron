// OpenAI Service for strategic insights and daily planning
import { Project, Task, UserPreferences } from '../../types';
import { 
  DailyPlan, 
  WorkloadAnalysis
} from './geminiService';

// OpenAI strategic insights generation
export const generateOpenAIInsights = async (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences
): Promise<{ blocked_tasks: Task[]; projects_needing_attention: Project[]; recommendations: string[] }> => {
  const defaultInsights = {
    blocked_tasks: [],
    projects_needing_attention: [],
    recommendations: ['Configure OpenAI API key in settings for AI-powered insights.']
  };

  try {
    // Call the serverless function instead of direct API call
    const response = await fetch('/api/openai-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projects,
        tasks,
        userPreferences
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const insights = await response.json();
    return insights;

  } catch (error) {
    console.error('Error generating OpenAI insights:', error);
    defaultInsights.recommendations = ["Error generating insights. Check OpenAI API configuration."];
    return defaultInsights;
  }
};

// OpenAI daily plan generation
export const generateOpenAIDailyPlan = async (
  date: Date,
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  focusBlockData?: any[]
): Promise<DailyPlan> => {
  const defaultPlan: DailyPlan = {
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
      recommendations: ['Configure OpenAI API key for intelligent daily planning.']
    },
    ai_recommendations: ['Configure OpenAI API key for personalized recommendations.']
  };

  try {
    // Call the serverless function instead of direct API call
    const response = await fetch('/api/ai-daily-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: date.toISOString(),
        projects,
        tasks,
        userPreferences: { ...userPreferences, ai_provider: 'openai' },
        focusBlockData
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const plan = await response.json();
    return plan;

  } catch (error) {
    console.error('Error generating OpenAI daily plan:', error);
    defaultPlan.ai_recommendations = ["Error generating daily plan. Check OpenAI API configuration."];
    return defaultPlan;
  }
};

// OpenAI workload analysis
export const generateOpenAIWorkloadAnalysis = async (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  schedulingData?: any
): Promise<WorkloadAnalysis> => {
  const defaultAnalysis: WorkloadAnalysis = {
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
      mitigation_strategies: ['Configure OpenAI API key for intelligent bottleneck detection.']
    },
    work_life_balance: {
      business_hours_utilization: 0,
      personal_time_protection: 100,
      context_switching_frequency: 0,
      balance_score: 50,
      improvement_suggestions: ['Set up OpenAI API and working hours preferences for better analysis.']
    },
    efficiency_metrics: {
      task_completion_velocity: 0,
      priority_alignment_score: 0,
      energy_utilization_efficiency: 0,
      focus_time_percentage: 0,
      multitasking_overhead: 0
    },
    strategic_recommendations: ['Configure OpenAI API key for comprehensive workload analysis.']
  };

  try {
    // Call the serverless function instead of direct API call
    const response = await fetch('/api/ai-unified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'workload-analysis',
        projects,
        tasks,
        userPreferences: { ...userPreferences, ai_provider: 'openai' },
        schedulingData
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const analysis = await response.json();
    return analysis;

  } catch (error) {
    console.error('Error generating OpenAI workload analysis:', error);
    defaultAnalysis.strategic_recommendations = ["Error generating workload analysis. Check OpenAI API configuration."];
    return defaultAnalysis;
  }
};

// All API calls, prompt construction, and response parsing now handled by serverless functions

export default {
  generateInsights: generateOpenAIInsights,
  generateDailyPlan: generateOpenAIDailyPlan,
  generateWorkloadAnalysis: generateOpenAIWorkloadAnalysis
};