// Unified AI Service Layer with Provider Selection and Failover
import { Project, Task, UserPreferences } from '../../types';
import { generateStrategicInsights as generateGeminiInsights, generateDailyPlan as generateGeminiDailyPlan, generateWorkloadAnalysis as generateGeminiWorkloadAnalysis, DailyPlan, WorkloadAnalysis } from './geminiService';
import { generateClaudeInsights, generateClaudeDailyPlan, generateClaudeWorkloadAnalysis } from './claudeService';
import { generateOpenAIInsights, generateOpenAIDailyPlan, generateOpenAIWorkloadAnalysis } from './openaiService';

export interface AIInsights {
  blocked_tasks: any[];
  projects_needing_attention: any[];
  recommendations?: string[];
  focus_recommendations?: string[];
  priority_balance_score?: number;
}

export interface AIServiceResult<T> {
  data: T;
  provider_used: string;
  success: boolean;
  error?: string;
  fallback_used?: boolean;
}

// AI Provider priority order for failover
const PROVIDER_FAILOVER_ORDER: string[] = ['gemini', 'claude', 'openai'];

// Provider availability check
const checkProviderAvailability = (provider: string, userPreferences: UserPreferences): boolean => {
  switch (provider) {
    case 'gemini':
      // Check for environment variable (Vite prefixed) or user preference
      const env = (import.meta as any).env;
      const hasGeminiKey = env?.VITE_GEMINI_API_KEY || env?.VITE_API_KEY;
      return !!(hasGeminiKey && userPreferences.selected_gemini_model);
    case 'claude':
      return !!(userPreferences.claude_api_key);
    case 'openai':
      return !!(userPreferences.openai_api_key);
    default:
      return false;
  }
};

// Get next available provider in failover order
const getNextAvailableProvider = (currentProvider: string, userPreferences: UserPreferences): string | null => {
  const currentIndex = PROVIDER_FAILOVER_ORDER.indexOf(currentProvider);
  
  for (let i = currentIndex + 1; i < PROVIDER_FAILOVER_ORDER.length; i++) {
    const provider = PROVIDER_FAILOVER_ORDER[i];
    if (checkProviderAvailability(provider, userPreferences)) {
      return provider;
    }
  }
  
  return null;
};

// Unified strategic insights generation with fallback
export const generateAIInsights = async (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  _allowFallback: boolean = true
): Promise<AIServiceResult<AIInsights>> => {
  try {
    // Call the unified serverless function which handles provider selection and fallback
    const response = await fetch('/api/ai-unified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'insights',
        projects,
        tasks,
        userPreferences
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error in unified AI insights:', error);
    return {
      data: {
        blocked_tasks: [],
        projects_needing_attention: [],
        recommendations: ['AI analysis failed. Check provider configurations and try again.']
      },
      provider_used: 'none',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Unified daily plan generation with fallback
export const generateAIDailyPlan = async (
  date: Date,
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  focusBlockData?: any[],
  allowFallback: boolean = true
): Promise<AIServiceResult<DailyPlan>> => {
  const primaryProvider = userPreferences.ai_provider;
  
  // Check if primary provider is available
  if (!checkProviderAvailability(primaryProvider, userPreferences)) {
    const fallbackProvider = allowFallback ? getNextAvailableProvider('', userPreferences) : null;
    
    if (!fallbackProvider) {
      return {
        data: {
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
            recommendations: ['No AI providers configured for daily planning.']
          },
          ai_recommendations: ['Configure AI provider for intelligent daily planning.']
        },
        provider_used: 'none',
        success: false,
        error: 'No AI providers available'
      };
    }
    
    // Use fallback provider
    try {
      const plan = await callDailyPlanProvider(fallbackProvider, date, projects, tasks, userPreferences, focusBlockData);
      return {
        data: plan,
        provider_used: fallbackProvider,
        success: true,
        fallback_used: true
      };
    } catch (error) {
      return generateDefaultDailyPlan(date, fallbackProvider, error instanceof Error ? error.message : 'Unknown error', true);
    }
  }
  
  // Try primary provider
  try {
    const plan = await callDailyPlanProvider(primaryProvider, date, projects, tasks, userPreferences, focusBlockData);
    return {
      data: plan,
      provider_used: primaryProvider,
      success: true
    };
  } catch (error) {
    console.warn(`Primary provider ${primaryProvider} failed:`, error);
    
    // Try fallback if enabled
    if (allowFallback) {
      const fallbackProvider = getNextAvailableProvider(primaryProvider, userPreferences);
      
      if (fallbackProvider) {
        try {
          const plan = await callDailyPlanProvider(fallbackProvider, date, projects, tasks, userPreferences, focusBlockData);
          return {
            data: plan,
            provider_used: fallbackProvider,
            success: true,
            fallback_used: true
          };
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
        }
      }
    }
    
    // All providers failed
    return generateDefaultDailyPlan(date, primaryProvider, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Unified workload analysis with fallback
export const generateAIWorkloadAnalysis = async (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  schedulingData?: any,
  allowFallback: boolean = true
): Promise<AIServiceResult<WorkloadAnalysis>> => {
  const primaryProvider = userPreferences.ai_provider;
  
  // Check if primary provider is available
  if (!checkProviderAvailability(primaryProvider, userPreferences)) {
    const fallbackProvider = allowFallback ? getNextAvailableProvider('', userPreferences) : null;
    
    if (!fallbackProvider) {
      return {
        data: generateDefaultWorkloadAnalysis('No AI providers configured'),
        provider_used: 'none',
        success: false,
        error: 'No AI providers available'
      };
    }
    
    // Use fallback provider
    try {
      const analysis = await callWorkloadAnalysisProvider(fallbackProvider, projects, tasks, userPreferences, schedulingData);
      return {
        data: analysis,
        provider_used: fallbackProvider,
        success: true,
        fallback_used: true
      };
    } catch (error) {
      return {
        data: generateDefaultWorkloadAnalysis(`Fallback provider ${fallbackProvider} failed`),
        provider_used: fallbackProvider,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback_used: true
      };
    }
  }
  
  // Try primary provider
  try {
    const analysis = await callWorkloadAnalysisProvider(primaryProvider, projects, tasks, userPreferences, schedulingData);
    return {
      data: analysis,
      provider_used: primaryProvider,
      success: true
    };
  } catch (error) {
    console.warn(`Primary provider ${primaryProvider} failed:`, error);
    
    // Try fallback if enabled
    if (allowFallback) {
      const fallbackProvider = getNextAvailableProvider(primaryProvider, userPreferences);
      
      if (fallbackProvider) {
        try {
          const analysis = await callWorkloadAnalysisProvider(fallbackProvider, projects, tasks, userPreferences, schedulingData);
          return {
            data: analysis,
            provider_used: fallbackProvider,
            success: true,
            fallback_used: true
          };
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
        }
      }
    }
    
    // All providers failed
    return {
      data: generateDefaultWorkloadAnalysis(`AI analysis failed with ${primaryProvider}`),
      provider_used: primaryProvider,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Provider-specific function calls
const _callInsightsProvider = async (
  provider: string,
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences
): Promise<AIInsights> => {
  switch (provider) {
    case 'gemini':
      return await generateGeminiInsights(projects, tasks, userPreferences);
    case 'claude':
      return await generateClaudeInsights(projects, tasks, userPreferences);
    case 'openai':
      return await generateOpenAIInsights(projects, tasks, userPreferences);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};

const callDailyPlanProvider = async (
  provider: string,
  date: Date,
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  focusBlockData?: any[]
): Promise<DailyPlan> => {
  switch (provider) {
    case 'gemini':
      return await generateGeminiDailyPlan(date, projects, tasks, userPreferences, focusBlockData);
    case 'claude':
      return await generateClaudeDailyPlan(date, projects, tasks, userPreferences, focusBlockData);
    case 'openai':
      return await generateOpenAIDailyPlan(date, projects, tasks, userPreferences, focusBlockData);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};

const callWorkloadAnalysisProvider = async (
  provider: string,
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  schedulingData?: any
): Promise<WorkloadAnalysis> => {
  switch (provider) {
    case 'gemini':
      return await generateGeminiWorkloadAnalysis(projects, tasks, userPreferences, schedulingData);
    case 'claude':
      return await generateClaudeWorkloadAnalysis(projects, tasks, userPreferences, schedulingData);
    case 'openai':
      return await generateOpenAIWorkloadAnalysis(projects, tasks, userPreferences, schedulingData);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};

// Default data generators for error cases
const generateDefaultDailyPlan = (date: Date, provider: string, error: string, fallbackUsed: boolean = false): AIServiceResult<DailyPlan> => {
  return {
    data: {
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
        recommendations: ['AI daily planning failed. Manual scheduling recommended.']
      },
      ai_recommendations: [`Error with ${provider}: ${error}`]
    },
    provider_used: provider,
    success: false,
    error: error,
    fallback_used: fallbackUsed
  };
};

const generateDefaultWorkloadAnalysis = (reason: string): WorkloadAnalysis => {
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
      mitigation_strategies: [`AI analysis unavailable: ${reason}`]
    },
    work_life_balance: {
      business_hours_utilization: 0,
      personal_time_protection: 100,
      context_switching_frequency: 0,
      balance_score: 50,
      improvement_suggestions: ['Configure AI providers for workload analysis.']
    },
    efficiency_metrics: {
      task_completion_velocity: 0,
      priority_alignment_score: 0,
      energy_utilization_efficiency: 0,
      focus_time_percentage: 0,
      multitasking_overhead: 0
    },
    strategic_recommendations: ['Set up AI providers for comprehensive workload analysis.']
  };
};

// Provider health check and diagnostics
export const checkAIProviderHealth = async (userPreferences: UserPreferences): Promise<{
  providers: Record<string, { available: boolean; configured: boolean; error?: string }>;
  primary_provider: string;
  fallback_available: boolean;
}> => {
  const providers: Record<string, { available: boolean; configured: boolean; error?: string }> = {};
  
  // Check environment variables and API keys
  const env = (import.meta as any).env;
  const hasGeminiKey = env?.VITE_GEMINI_API_KEY || env?.VITE_API_KEY;
  
  // Check Gemini
  providers.gemini = {
    available: checkProviderAvailability('gemini', userPreferences),
    configured: !!(hasGeminiKey && userPreferences.selected_gemini_model)
  };
  
  // Check Claude - consider configured if API key is present, use default model if not specified
  providers.claude = {
    available: checkProviderAvailability('claude', userPreferences),
    configured: !!(userPreferences.claude_api_key)
  };
  
  // Check OpenAI - consider configured if API key is present, use default model if not specified
  providers.openai = {
    available: checkProviderAvailability('openai', userPreferences),
    configured: !!(userPreferences.openai_api_key)
  };
  
  const primaryProvider = userPreferences.ai_provider;
  const fallbackAvailable = !!getNextAvailableProvider(primaryProvider, userPreferences);
  
  return {
    providers,
    primary_provider: primaryProvider,
    fallback_available: fallbackAvailable
  };
};

// Export interface types for use in components
export type { DailyPlan, WorkloadAnalysis }; 