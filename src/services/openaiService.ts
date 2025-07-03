// OpenAI Service for strategic insights and daily planning
import { Project, Task, UserPreferences } from '../../types';
import { 
  DailyPlan, 
  WorkloadAnalysis
} from './geminiService';

// OpenAI API Client setup
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    logprobs: null;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

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

  if (!userPreferences.openai_api_key) {
    console.warn("OpenAI API key not configured.");
    return defaultPlan;
  }

  const prompt = constructOpenAIDailyPlanPrompt(date, projects, tasks, userPreferences, focusBlockData);

  try {
    const response = await callOpenAIAPI(
      userPreferences.openai_api_key,
      userPreferences.selected_openai_model || 'gpt-4-turbo-preview',
      prompt
    );

    const plan = parseOpenAIDailyPlanResponse(response);
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

  if (!userPreferences.openai_api_key) {
    console.warn("OpenAI API key not configured.");
    return defaultAnalysis;
  }

  const prompt = constructOpenAIWorkloadAnalysisPrompt(projects, tasks, userPreferences, schedulingData);

  try {
    const response = await callOpenAIAPI(
      userPreferences.openai_api_key,
      userPreferences.selected_openai_model || 'gpt-4-turbo-preview',
      prompt
    );

    const analysis = parseOpenAIWorkloadAnalysisResponse(response);
    return analysis;

  } catch (error) {
    console.error('Error generating OpenAI workload analysis:', error);
    defaultAnalysis.strategic_recommendations = ["Error generating workload analysis. Check OpenAI API configuration."];
    return defaultAnalysis;
  }
};

// OpenAI API call wrapper
const callOpenAIAPI = async (
  apiKey: string,
  model: string,
  prompt: string
): Promise<OpenAIResponse> => {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: 'You are an expert productivity consultant and project management advisor. Provide precise, actionable insights in the requested JSON format.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await fetch(OPENAI_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 4000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<OpenAIResponse>;
};



// Enhanced prompt construction for OpenAI daily planning
const constructOpenAIDailyPlanPrompt = (
  date: Date,
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  focusBlockData?: any[]
): string => {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  
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
Create an optimized daily plan for ${dayOfWeek}, ${dateStr} as a productivity expert.

WORKING CONFIGURATION:
${JSON.stringify(workingHours, null, 2)}

AVAILABLE TASKS (${availableTasks.length}):
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

Optimize the daily plan for:
- Energy level alignment (high-energy tasks during peak hours)
- Context switching minimization
- Priority and deadline considerations
- Work-life balance
- Sustainable productivity

Return as JSON with this exact structure:
{
  "date": "${dateStr}",
  "recommended_schedule": [
    {
      "task_id": "string",
      "task_title": "string",
      "suggested_start_time": "HH:MM",
      "suggested_duration_minutes": 60,
      "energy_match_score": 85,
      "context_match_score": 90,
      "priority_score": 75,
      "reasoning": "string"
    }
  ],
  "focus_blocks": [
    {
      "block_type": "deep_work",
      "start_time": "HH:MM",
      "duration_minutes": 90,
      "energy_level": "high",
      "optimal_tasks": ["task_id1", "task_id2"],
      "description": "string"
    }
  ],
  "energy_optimization": {
    "peak_hours": ["09:00", "10:30"],
    "low_energy_periods": ["14:00", "15:30"],
    "recommended_task_distribution": {
      "high_energy_tasks": 2,
      "medium_energy_tasks": 4,
      "low_energy_tasks": 2
    },
    "energy_efficiency_score": 85
  },
  "workload_summary": {
    "total_scheduled_hours": 6.5,
    "available_capacity_hours": 8,
    "utilization_percentage": 81,
    "overload_risk": "low",
    "bottlenecks": ["string"],
    "recommendations": ["string"]
  },
  "ai_recommendations": ["string", "string", "string"]
}
`;
};

// Enhanced prompt construction for OpenAI workload analysis
const constructOpenAIWorkloadAnalysisPrompt = (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  schedulingData?: any
): string => {
  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const totalEstimatedHours = activeTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  
  return `
Perform comprehensive workload analysis as an expert consultant:

CURRENT WORKLOAD:
- Active Tasks: ${activeTasks.length}
- Total Hours: ${totalEstimatedHours}
- High Priority: ${activeTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length}

DETAILED TASKS:
${JSON.stringify(activeTasks.map(t => ({
  id: t.id,
  title: t.title,
  priority: t.priority,
  estimated_hours: t.estimated_hours,
  due_date: t.due_date,
  dependencies: t.dependencies,
  project_id: t.project_id
})), null, 2)}

PROJECTS:
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
- Focus Duration: ${userPreferences.focus_block_duration} minutes
- Break Duration: ${userPreferences.break_duration} minutes

${schedulingData ? `SCHEDULING DATA:\n${JSON.stringify(schedulingData, null, 2)}` : ''}

Analyze capacity, bottlenecks, work-life balance, and efficiency. Return comprehensive assessment as JSON:
{
  "capacity_analysis": {
    "current_workload_hours": 32.5,
    "available_capacity_hours": 40,
    "utilization_rate": 0.81,
    "burnout_risk_score": 25,
    "optimal_capacity_range": {"min": 6, "max": 8}
  },
  "bottleneck_detection": {
    "resource_bottlenecks": ["string"],
    "dependency_bottlenecks": ["string"],
    "skill_bottlenecks": ["string"],
    "time_bottlenecks": ["string"],
    "mitigation_strategies": ["string"]
  },
  "work_life_balance": {
    "business_hours_utilization": 85,
    "personal_time_protection": 90,
    "context_switching_frequency": 15,
    "balance_score": 82,
    "improvement_suggestions": ["string"]
  },
  "efficiency_metrics": {
    "task_completion_velocity": 1.2,
    "priority_alignment_score": 78,
    "energy_utilization_efficiency": 85,
    "focus_time_percentage": 65,
    "multitasking_overhead": 20
  },
  "strategic_recommendations": ["string", "string", "string"]
}
`;
};



const parseOpenAIDailyPlanResponse = (response: OpenAIResponse): DailyPlan => {
  try {
    const content = response.choices[0].message.content;
    const plan = JSON.parse(content) as DailyPlan;
    
    // Validate required fields
    if (!plan.date || !plan.recommended_schedule || !plan.focus_blocks) {
      throw new Error("OpenAI response missing required daily plan fields.");
    }
    
    return plan;
  } catch (error) {
    console.error('Error parsing OpenAI daily plan response:', error);
    // Return default plan with error message
    return {
      date: new Date().toISOString().split('T')[0],
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
        recommendations: ['Error parsing OpenAI daily plan response.']
      },
      ai_recommendations: ['Error generating daily plan from OpenAI. Check API configuration.']
    };
  }
};

const parseOpenAIWorkloadAnalysisResponse = (response: OpenAIResponse): WorkloadAnalysis => {
  try {
    const content = response.choices[0].message.content;
    const analysis = JSON.parse(content) as WorkloadAnalysis;
    
    // Validate required fields
    if (!analysis.capacity_analysis || !analysis.bottleneck_detection || !analysis.efficiency_metrics) {
      throw new Error("OpenAI response missing required workload analysis fields.");
    }
    
    return analysis;
  } catch (error) {
    console.error('Error parsing OpenAI workload analysis response:', error);
    // Return default analysis with error message
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
        mitigation_strategies: ['Error analyzing bottlenecks with OpenAI.']
      },
      work_life_balance: {
        business_hours_utilization: 0,
        personal_time_protection: 100,
        context_switching_frequency: 0,
        balance_score: 50,
        improvement_suggestions: ['Error analyzing work-life balance with OpenAI.']
      },
      efficiency_metrics: {
        task_completion_velocity: 0,
        priority_alignment_score: 0,
        energy_utilization_efficiency: 0,
        focus_time_percentage: 0,
        multitasking_overhead: 0
      },
      strategic_recommendations: ['Error generating workload analysis from OpenAI. Check API configuration.']
    };
  }
};

export default {
  generateInsights: generateOpenAIInsights,
  generateDailyPlan: generateOpenAIDailyPlan,
  generateWorkloadAnalysis: generateOpenAIWorkloadAnalysis
}; 