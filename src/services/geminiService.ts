import { GoogleGenAI, /*GenerateContentResponse*/ } from "@google/genai";
import { Project, Task, StrategicInsights, UserPreferences, /*AIProvider*/ } from '../../types';

// Initialize Gemini AI service
let geminiAI: GoogleGenAI | null = null;

export const initializeGeminiService = (apiKey: string) => {
  if (!apiKey) {
    console.warn('Gemini API key not provided');
    return false;
  }
  
  try {
    geminiAI = new GoogleGenAI(apiKey);
    return true;
  } catch (error) {
    console.error('Failed to initialize Gemini service:', error);
    return false;
  }
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
  capacity_analysis: CapacityAnalysis;
  bottleneck_detection: BottleneckDetection;
  work_life_balance: WorkLifeBalance;
  efficiency_metrics: EfficiencyMetrics;
  strategic_recommendations: string[];
}

export interface CapacityAnalysis {
  current_workload_hours: number;
  available_capacity_hours: number;
  utilization_rate: number;
  burnout_risk_score: number;
  optimal_capacity_range: { min: number; max: number };
}

export interface BottleneckDetection {
  resource_bottlenecks: string[];
  dependency_bottlenecks: string[];
  skill_bottlenecks: string[];
  time_bottlenecks: string[];
  mitigation_strategies: string[];
}

export interface WorkLifeBalance {
  business_hours_utilization: number;
  personal_time_protection: number;
  context_switching_frequency: number;
  balance_score: number;
  improvement_suggestions: string[];
}

export interface EfficiencyMetrics {
  task_completion_velocity: number;
  priority_alignment_score: number;
  energy_utilization_efficiency: number;
  focus_time_percentage: number;
  multitasking_overhead: number;
}



// Initialize AI client with API key
// Note: Gemini client initialization moved to service initialization




export const generateStrategicInsights = async (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences
): Promise<StrategicInsights> => {
  const defaultInsights: StrategicInsights = {
    blocked_tasks: [],
    projects_needing_attention: [],
    focus_recommendations: [],
    priority_balance_score: 0,
  };

  if (userPreferences.ai_provider === 'gemini') { // snake_case
    try {
      // Call the serverless function instead of direct API call
      const response = await fetch('/api/gemini-insights', {
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
      console.error('Error generating Gemini insights:', error);
      defaultInsights.focus_recommendations = ["Error generating insights. Check Gemini API configuration."];
      return defaultInsights;
    }
  }

  // Fallback for other providers or no provider configured
  defaultInsights.focus_recommendations = ["Configure Gemini API key for AI insights."];
  return defaultInsights;
};

// Enhanced daily plan generation leveraging TaskScheduler intelligence
// Helper function to ensure Gemini is initialized with the user's API key
const ensureGeminiInitialized = (userPreferences: UserPreferences): boolean => {
  // Check for API key from environment variables first, then user preferences
  const env = (import.meta as any).env;
  const apiKey = env?.VITE_GEMINI_API_KEY || env?.VITE_API_KEY || userPreferences.gemini_api_key;
  
  if (!apiKey) {
    return false;
  }
  
  if (!geminiAI) {
    return initializeGeminiService(apiKey);
  }
  
  return true;
};

export const generateDailyPlan = async (
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
      recommendations: ['Configure AI provider for intelligent daily planning.']
    },
    ai_recommendations: ['Configure AI provider for personalized recommendations.']
  };

  if (userPreferences.ai_provider === 'gemini') {
    if (!ensureGeminiInitialized(userPreferences)) {
      console.warn("Gemini API key not configured. Returning default plan.");
      return defaultPlan;
    }

    const modelToUse = userPreferences.selected_gemini_model;
    if (!modelToUse) {
      console.warn("No Gemini model selected. Returning default plan.");
      return defaultPlan;
    }

    const prompt = constructDailyPlanPrompt(date, projects, tasks, userPreferences, focusBlockData);

    try {
      if (!geminiAI) {
        throw new Error('Gemini AI not initialized');
      }
      const response = await geminiAI.getGenerativeModel({ model: modelToUse }).generateContent(prompt);

      let jsonStr = response.response.text()?.trim() || '';
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      const plan = JSON.parse(jsonStr) as DailyPlan;
      
      // Validate the response structure
      if (!plan.date || !plan.recommended_schedule || !plan.focus_blocks) {
        throw new Error("AI response format error: missing required daily plan fields.");
      }
      
      return plan;

    } catch (error) {
      console.error(`Error generating daily plan from Gemini model ${modelToUse}:`, error);
      defaultPlan.ai_recommendations = ["Error generating daily plan. Check console for details."];
      return defaultPlan;
    }
  }

  // For non-Gemini providers, return enhanced default plan
  if (userPreferences.ai_provider === 'claude') {
    defaultPlan.ai_recommendations = ["Claude integration not yet available for daily planning."];
  } else if (userPreferences.ai_provider === 'openai') {
    defaultPlan.ai_recommendations = ["OpenAI integration not yet available for daily planning."];
  }

  return defaultPlan;
};

// Advanced workload analysis using calendar and scheduling data
export const generateWorkloadAnalysis = async (
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
      mitigation_strategies: ['Configure AI provider for intelligent bottleneck detection.']
    },
    work_life_balance: {
      business_hours_utilization: 0,
      personal_time_protection: 100,
      context_switching_frequency: 0,
      balance_score: 50,
      improvement_suggestions: ['Set up working hours preferences for better analysis.']
    },
    efficiency_metrics: {
      task_completion_velocity: 0,
      priority_alignment_score: 0,
      energy_utilization_efficiency: 0,
      focus_time_percentage: 0,
      multitasking_overhead: 0
    },
    strategic_recommendations: ['Configure AI provider for comprehensive workload analysis.']
  };

  if (userPreferences.ai_provider === 'gemini') {
    if (!ensureGeminiInitialized(userPreferences)) {
      console.warn("Gemini API key not configured. Returning default analysis.");
      return defaultAnalysis;
    }

    const modelToUse = userPreferences.selected_gemini_model;
    if (!modelToUse) {
      console.warn("No Gemini model selected. Returning default analysis.");
      return defaultAnalysis;
    }

    const prompt = constructWorkloadAnalysisPrompt(projects, tasks, userPreferences, schedulingData);

    try {
      if (!geminiAI) {
        throw new Error('Gemini AI not initialized');
      }
      const response = await geminiAI.getGenerativeModel({ model: modelToUse }).generateContent(prompt);

      let jsonStr = response.response.text()?.trim() || '';
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      const analysis = JSON.parse(jsonStr) as WorkloadAnalysis;
      
      // Validate the response structure
      if (!analysis.capacity_analysis || !analysis.bottleneck_detection || !analysis.efficiency_metrics) {
        throw new Error("AI response format error: missing required workload analysis fields.");
      }
      
      return analysis;

    } catch (error) {
      console.error(`Error generating workload analysis from Gemini model ${modelToUse}:`, error);
      defaultAnalysis.strategic_recommendations = ["Error generating workload analysis. Check console for details."];
      return defaultAnalysis;
    }
  }

  return defaultAnalysis;
};

// Enhanced prompt construction for daily plan generation
const constructDailyPlanPrompt = (
  date: Date,
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  focusBlockData?: any[]
): string => {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  
  // Filter available tasks for the date
  const availableTasks = tasks.filter(task => 
    task.status !== 'completed' && 
    (!task.due_date || new Date(task.due_date) >= date)
  );

  const workingHours = {
    start: userPreferences.working_hours_start,
    end: userPreferences.working_hours_end,
    business_start: userPreferences.business_hours_start,
    business_end: userPreferences.business_hours_end,
    focus_block_duration: userPreferences.focus_block_duration,
    break_duration: userPreferences.break_duration
  };

  return `
Create an intelligent daily plan for ${dayOfWeek}, ${dateStr} based on the following data:

WORKING HOURS CONFIGURATION:
${JSON.stringify(workingHours, null, 2)}

AVAILABLE TASKS (${availableTasks.length} tasks):
${JSON.stringify(availableTasks.map(t => ({
  id: t.id,
  title: t.title,
  priority: t.priority,
  estimated_hours: t.estimated_hours,
  energy_level: t.energy_level,
  task_context: t.task_context,
  due_date: t.due_date,
  project_id: t.project_id
})), null, 2)}

PROJECTS CONTEXT:
${JSON.stringify(projects.map(p => ({
  id: p.id,
  title: p.title,
  context: p.context,
  status: p.status,
  deadline: p.deadline
})), null, 2)}

${focusBlockData ? `EXISTING FOCUS BLOCKS:\n${JSON.stringify(focusBlockData, null, 2)}` : ''}

Generate a comprehensive daily plan that:
1. Optimally schedules tasks based on energy levels and time availability
2. Suggests focus blocks for deep work aligned with business/personal contexts
3. Provides energy optimization recommendations
4. Includes workload summary with capacity analysis
5. Offers actionable AI recommendations for productivity

Return as JSON with this exact structure:
{
  "date": "${dateStr}",
  "recommended_schedule": [
    {
      "task_id": "string",
      "task_title": "string",
      "suggested_start_time": "HH:MM",
      "suggested_duration_minutes": number,
      "energy_match_score": number,
      "context_match_score": number,
      "priority_score": number,
      "reasoning": "string"
    }
  ],
  "focus_blocks": [
    {
      "block_type": "deep_work|focused_execution|creative|analytical",
      "start_time": "HH:MM",
      "duration_minutes": number,
      "energy_level": "high|medium|low",
      "optimal_tasks": ["task_id1", "task_id2"],
      "description": "string"
    }
  ],
  "energy_optimization": {
    "peak_hours": ["HH:MM", "HH:MM"],
    "low_energy_periods": ["HH:MM", "HH:MM"],
    "recommended_task_distribution": {
      "high_energy_tasks": number,
      "medium_energy_tasks": number,
      "low_energy_tasks": number
    },
    "energy_efficiency_score": number
  },
  "workload_summary": {
    "total_scheduled_hours": number,
    "available_capacity_hours": number,
    "utilization_percentage": number,
    "overload_risk": "low|medium|high",
    "bottlenecks": ["string"],
    "recommendations": ["string"]
  },
  "ai_recommendations": ["string", "string", "string"]
}
`;
};

// Enhanced prompt construction for workload analysis
const constructWorkloadAnalysisPrompt = (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  schedulingData?: any
): string => {
  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const totalEstimatedHours = activeTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  
  return `
Perform comprehensive workload analysis based on:

CURRENT TASK LOAD:
- Total Active Tasks: ${activeTasks.length}
- Total Estimated Hours: ${totalEstimatedHours}
- High Priority Tasks: ${activeTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length}

TASK BREAKDOWN:
${JSON.stringify(activeTasks.map(t => ({
  id: t.id,
  title: t.title,
  priority: t.priority,
  estimated_hours: t.estimated_hours,
  due_date: t.due_date,
  dependencies: t.dependencies,
  project_id: t.project_id
})), null, 2)}

PROJECT STATUS:
${JSON.stringify(projects.map(p => ({
  id: p.id,
  title: p.title,
  status: p.status,
  deadline: p.deadline,
  context: p.context
})), null, 2)}

USER CAPACITY:
- Working Hours: ${userPreferences.working_hours_start} - ${userPreferences.working_hours_end}
- Business Hours: ${userPreferences.business_hours_start || 'Not Set'} - ${userPreferences.business_hours_end || 'Not Set'}
- Focus Block Duration: ${userPreferences.focus_block_duration} minutes
- Break Duration: ${userPreferences.break_duration} minutes

${schedulingData ? `SCHEDULING DATA:\n${JSON.stringify(schedulingData, null, 2)}` : ''}

Analyze and return comprehensive workload assessment as JSON:
{
  "capacity_analysis": {
    "current_workload_hours": number,
    "available_capacity_hours": number,
    "utilization_rate": number,
    "burnout_risk_score": number,
    "optimal_capacity_range": {"min": number, "max": number}
  },
  "bottleneck_detection": {
    "resource_bottlenecks": ["string"],
    "dependency_bottlenecks": ["string"],
    "skill_bottlenecks": ["string"],
    "time_bottlenecks": ["string"],
    "mitigation_strategies": ["string"]
  },
  "work_life_balance": {
    "business_hours_utilization": number,
    "personal_time_protection": number,
    "context_switching_frequency": number,
    "balance_score": number,
    "improvement_suggestions": ["string"]
  },
  "efficiency_metrics": {
    "task_completion_velocity": number,
    "priority_alignment_score": number,
    "energy_utilization_efficiency": number,
    "focus_time_percentage": number,
    "multitasking_overhead": number
  },
  "strategic_recommendations": ["string", "string", "string"]
}
`;
};

export const getGeminiInsights = async (
  _projects: Project[],
  _tasks: Task[],
  apiKey?: string
): Promise<StrategicInsights> => {
  try {
    // Initialize if not already done
    if (!geminiAI && apiKey) {
      initializeGeminiService(apiKey);
    }

    if (!geminiAI) {
      throw new Error('Gemini service not initialized. Please provide an API key.');
    }

    // Temporarily disable API calls due to interface issues
    // TODO: Fix the GoogleGenAI API integration
    console.warn('Gemini API integration temporarily disabled due to interface issues');
    
    return {
      blocked_tasks: [],
      projects_needing_attention: [],
      focus_recommendations: ["Gemini API integration in progress"],
      priority_balance_score: 0,
    };
  } catch (error) {
    console.error('Error generating Gemini insights:', error);
    return {
      blocked_tasks: [],
      projects_needing_attention: [],
      focus_recommendations: ["Error generating insights. Check Gemini API configuration."],
      priority_balance_score: 0,
    };
  }
};