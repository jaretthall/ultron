// Claude AI Service for strategic insights and daily planning
import { Project, Task, UserPreferences } from '../../types';
import { 
  DailyPlan, 
  WorkloadAnalysis
} from './geminiService';

// Claude API Client setup
// Note: This is a placeholder for Claude integration
// In production, this would use the official Claude API
const CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';

interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ClaudeResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  id: string;
  model: string;
  role: 'assistant';
  stop_reason: string;
  stop_sequence: null | string;
  type: 'message';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Claude strategic insights generation
export const generateClaudeInsights = async (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences
): Promise<{ blocked_tasks: Task[]; projects_needing_attention: Project[]; recommendations: string[] }> => {
  const defaultInsights = {
    blocked_tasks: [],
    projects_needing_attention: [],
    recommendations: ['Configure Claude API key in settings for AI-powered insights.']
  };

  try {
    // Call the serverless function instead of direct API call
    const response = await fetch('/api/claude-insights', {
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
    console.error('Error generating Claude insights:', error);
    defaultInsights.recommendations = ["Error generating insights. Check Claude API configuration."];
    return defaultInsights;
  }
};

// Claude daily plan generation
export const generateClaudeDailyPlan = async (
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
      recommendations: ['Configure Claude API key for intelligent daily planning.']
    },
    ai_recommendations: ['Configure Claude API key for personalized recommendations.']
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
        userPreferences: { ...userPreferences, ai_provider: 'claude' },
        focusBlockData
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const plan = await response.json();
    return plan;

  } catch (error) {
    console.error('Error generating Claude daily plan:', error);
    defaultPlan.ai_recommendations = ["Error generating daily plan. Check Claude API configuration."];
    return defaultPlan;
  }
};

// Claude workload analysis
export const generateClaudeWorkloadAnalysis = async (
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
      mitigation_strategies: ['Configure Claude API key for intelligent bottleneck detection.']
    },
    work_life_balance: {
      business_hours_utilization: 0,
      personal_time_protection: 100,
      context_switching_frequency: 0,
      balance_score: 50,
      improvement_suggestions: ['Set up Claude API and working hours preferences for better analysis.']
    },
    efficiency_metrics: {
      task_completion_velocity: 0,
      priority_alignment_score: 0,
      energy_utilization_efficiency: 0,
      focus_time_percentage: 0,
      multitasking_overhead: 0
    },
    strategic_recommendations: ['Configure Claude API key for comprehensive workload analysis.']
  };

  if (!userPreferences.claude_api_key) {
    console.warn("Claude API key not configured.");
    return defaultAnalysis;
  }

  const prompt = constructClaudeWorkloadAnalysisPrompt(projects, tasks, userPreferences, schedulingData);

  try {
    const response = await callClaudeAPI(
      userPreferences.claude_api_key,
      userPreferences.selected_claude_model || 'claude-3-5-sonnet-20241022',
      prompt
    );

    const analysis = parseClaudeWorkloadAnalysisResponse(response);
    return analysis;

  } catch (error) {
    console.error('Error generating Claude workload analysis:', error);
    defaultAnalysis.strategic_recommendations = ["Error generating workload analysis. Check Claude API configuration."];
    return defaultAnalysis;
  }
};

// Claude API call wrapper
const callClaudeAPI = async (
  apiKey: string,
  model: string,
  prompt: string
): Promise<ClaudeResponse> => {
  const messages: ClaudeMessage[] = [
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await fetch(CLAUDE_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4000,
      messages: messages
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<ClaudeResponse>;
};

// Enhanced prompt construction for Claude insights
const constructClaudeInsightsPrompt = (projects: Project[], tasks: Task[]): string => {
  return `
As a productivity and project management expert, analyze the following data and provide strategic insights:

PROJECTS (${projects.length} total):
${JSON.stringify(projects, null, 2)}

TASKS (${tasks.length} total):
${JSON.stringify(tasks, null, 2)}

Please analyze this data and identify:

1. BLOCKED TASKS: Tasks that cannot proceed due to dependencies, missing resources, or other blockers
2. PROJECTS NEEDING ATTENTION: Projects that are at risk, behind schedule, or require immediate action
3. STRATEGIC RECOMMENDATIONS: Actionable recommendations for improving productivity and project success

Return your analysis as a JSON object with this exact structure:
{
  "blocked_tasks": [
    {
      "id": "task_id",
      "title": "task_title",
      "reason": "why this task is blocked",
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "projects_needing_attention": [
    {
      "id": "project_id",
      "title": "project_title",
      "urgency_level": "high|medium|low",
      "issues": ["issue1", "issue2"],
      "recommended_actions": ["action1", "action2"]
    }
  ],
  "recommendations": [
    "Strategic recommendation 1",
    "Strategic recommendation 2",
    "Strategic recommendation 3"
  ]
}

Focus on providing actionable, specific insights that will help improve productivity and project outcomes.
`;
};

// Enhanced prompt construction for Claude daily planning
const constructClaudeDailyPlanPrompt = (
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
As an expert productivity consultant, create an intelligent daily plan for ${dayOfWeek}, ${dateStr}.

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

Create a comprehensive daily plan optimizing for:
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

// Enhanced prompt construction for Claude workload analysis
const constructClaudeWorkloadAnalysisPrompt = (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  schedulingData?: any
): string => {
  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const totalEstimatedHours = activeTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  
  return `
As a workload management expert, perform comprehensive analysis of the current productivity situation:

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

// Response parsing utilities
const parseClaudeResponse = (response: ClaudeResponse): { blocked_tasks: Task[]; projects_needing_attention: Project[]; recommendations: string[] } => {
  try {
    const content = response.content[0].text;
    
    // Extract JSON from Claude response (handle potential markdown formatting)
    let jsonStr = content.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsed = JSON.parse(jsonStr);
    
    return {
      blocked_tasks: parsed.blocked_tasks || [],
      projects_needing_attention: parsed.projects_needing_attention || [],
      recommendations: parsed.recommendations || ['Claude analysis completed successfully.']
    };
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    return {
      blocked_tasks: [],
      projects_needing_attention: [],
      recommendations: ['Error parsing Claude response. Check API configuration.']
    };
  }
};

const parseClaudeDailyPlanResponse = (response: ClaudeResponse): DailyPlan => {
  try {
    const content = response.content[0].text;
    
    let jsonStr = content.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const plan = JSON.parse(jsonStr) as DailyPlan;
    
    // Validate required fields
    if (!plan.date || !plan.recommended_schedule || !plan.focus_blocks) {
      throw new Error("Claude response missing required daily plan fields.");
    }
    
    return plan;
  } catch (error) {
    console.error('Error parsing Claude daily plan response:', error);
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
        recommendations: ['Error parsing Claude daily plan response.']
      },
      ai_recommendations: ['Error generating daily plan from Claude. Check API configuration.']
    };
  }
};

const parseClaudeWorkloadAnalysisResponse = (response: ClaudeResponse): WorkloadAnalysis => {
  try {
    const content = response.content[0].text;
    
    let jsonStr = content.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const analysis = JSON.parse(jsonStr) as WorkloadAnalysis;
    
    // Validate required fields
    if (!analysis.capacity_analysis || !analysis.bottleneck_detection || !analysis.efficiency_metrics) {
      throw new Error("Claude response missing required workload analysis fields.");
    }
    
    return analysis;
  } catch (error) {
    console.error('Error parsing Claude workload analysis response:', error);
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
        mitigation_strategies: ['Error analyzing bottlenecks with Claude.']
      },
      work_life_balance: {
        business_hours_utilization: 0,
        personal_time_protection: 100,
        context_switching_frequency: 0,
        balance_score: 50,
        improvement_suggestions: ['Error analyzing work-life balance with Claude.']
      },
      efficiency_metrics: {
        task_completion_velocity: 0,
        priority_alignment_score: 0,
        energy_utilization_efficiency: 0,
        focus_time_percentage: 0,
        multitasking_overhead: 0
      },
      strategic_recommendations: ['Error generating workload analysis from Claude. Check API configuration.']
    };
  }
};

export default {
  generateInsights: generateClaudeInsights,
  generateDailyPlan: generateClaudeDailyPlan,
  generateWorkloadAnalysis: generateClaudeWorkloadAnalysis
}; 