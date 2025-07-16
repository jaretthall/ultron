// Unified AI Service Layer with Provider Selection and Failover
import { Project, Task, UserPreferences } from '../../types';
// Gemini removed - no longer supported
import { generateClaudeDailyPlan, generateClaudeWorkloadAnalysis } from './claudeService';
import { generateOpenAIDailyPlan, generateOpenAIWorkloadAnalysis } from './openaiService';
import { DailyPlan, WorkloadAnalysis } from './geminiService'; // Keep types only for backward compatibility

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

// AI Provider priority order for failover (Gemini removed)
const PROVIDER_FAILOVER_ORDER: string[] = ['claude', 'openai'];

// Helper function to safely extract error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// Provider availability check
const checkProviderAvailability = (provider: string, userPreferences: UserPreferences): boolean => {
  switch (provider) {
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
  allowFallback: boolean = true
): Promise<AIServiceResult<AIInsights>> => {
  /* AI SERVICE ENABLED */
  const primaryProvider = userPreferences.ai_provider === 'gemini' ? 'claude' : userPreferences.ai_provider || 'claude';
  let currentProvider: string | null = primaryProvider;
  let result: AIServiceResult<AIInsights> | null = null;
  
  // Try primary provider first, then fallback providers if enabled
  while (currentProvider && !result?.success) {
    if (!checkProviderAvailability(currentProvider, userPreferences)) {
      console.warn(`Provider ${currentProvider} not available, trying next...`);
      currentProvider = allowFallback ? getNextAvailableProvider(currentProvider, userPreferences) : null;
      continue;
    }

    try {
      console.log(`Attempting to generate insights with provider: ${currentProvider}`);
      
      switch (currentProvider) {
        case 'claude':
          const claudeAnalysis = await generateClaudeWorkloadAnalysis(projects, tasks, userPreferences);
          console.log('Claude analysis result:', claudeAnalysis);
          result = {
            data: {
              blocked_tasks: claudeAnalysis?.bottleneck_detection?.resource_bottlenecks || [],
              projects_needing_attention: claudeAnalysis?.bottleneck_detection?.dependency_bottlenecks || [],
              recommendations: claudeAnalysis?.strategic_recommendations || [],
              focus_recommendations: claudeAnalysis?.strategic_recommendations || [],
              priority_balance_score: claudeAnalysis?.work_life_balance?.balance_score || 0
            },
            provider_used: 'claude',
            success: true,
            fallback_used: currentProvider !== primaryProvider
          };
          break;
          
        case 'openai':
          const openaiAnalysis = await generateOpenAIWorkloadAnalysis(projects, tasks, userPreferences);
          console.log('OpenAI analysis result:', openaiAnalysis);
          result = {
            data: {
              blocked_tasks: openaiAnalysis?.bottleneck_detection?.resource_bottlenecks || [],
              projects_needing_attention: openaiAnalysis?.bottleneck_detection?.dependency_bottlenecks || [],
              recommendations: openaiAnalysis?.strategic_recommendations || [],
              focus_recommendations: openaiAnalysis?.strategic_recommendations || [],
              priority_balance_score: openaiAnalysis?.work_life_balance?.balance_score || 0
            },
            provider_used: 'openai',
            success: true,
            fallback_used: currentProvider !== primaryProvider
          };
          break;
          
        default:
          throw new Error(`Unknown provider: ${currentProvider}`);
      }
      
    } catch (error: unknown) {
      console.error(`Error with provider ${currentProvider}:`, error);
      
      if (allowFallback) {
        currentProvider = getNextAvailableProvider(currentProvider, userPreferences);
        if (currentProvider) {
          console.log(`Falling back to provider: ${currentProvider}`);
          continue;
        }
      }
      
      // If we get here, all providers failed or fallback is disabled
      result = {
        data: {
          blocked_tasks: [],
          projects_needing_attention: [],
          recommendations: [`AI analysis failed with ${currentProvider}. ${allowFallback ? 'All fallback providers also failed.' : 'Fallback disabled.'}`]
        },
        provider_used: 'none',
        success: false,
        error: getErrorMessage(error)
      };
      break;
    }
  }

  return result || {
    data: {
      blocked_tasks: [],
      projects_needing_attention: [],
      recommendations: ['No AI providers available. Please configure API keys in settings.']
    },
    provider_used: 'none',
    success: false,
    error: 'No providers available'
  };
  /* END AI SERVICE */
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
  // TEMPORARY: Disable AI calls to prevent 502 errors during development
  console.warn('AI Daily Plan generation temporarily disabled to prevent 502 errors');
  console.log('Received params:', { date, projects: projects.length, tasks: tasks.length, userPreferences: !!userPreferences, focusBlockData, allowFallback });
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
        recommendations: ['AI service temporarily disabled for development']
      },
      ai_recommendations: ['Click "Generate Plan" button to manually request AI planning when needed']
    },
    provider_used: 'disabled',
    success: true,
    error: undefined
  };
  
  const primaryProvider = userPreferences.ai_provider === 'gemini' ? 'claude' : userPreferences.ai_provider || 'claude';
  
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
      const plan = await callDailyPlanProvider(fallbackProvider!, date, projects, tasks, userPreferences, focusBlockData);
      return {
        data: plan,
        provider_used: fallbackProvider!,
        success: true,
        fallback_used: true
      };
    } catch (error: unknown) {
      return generateDefaultDailyPlan(date, fallbackProvider!, getErrorMessage(error), true);
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
  } catch (error: unknown) {
    console.warn(`Primary provider ${primaryProvider} failed:`, error);
    
    // Try fallback if enabled
    if (allowFallback) {
      const fallbackProvider = getNextAvailableProvider(primaryProvider, userPreferences);
      
      if (fallbackProvider) {
        try {
          const plan = await callDailyPlanProvider(fallbackProvider!, date, projects, tasks, userPreferences, focusBlockData);
          return {
            data: plan,
            provider_used: fallbackProvider!,
            success: true,
            fallback_used: true
          };
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider!} also failed:`, fallbackError);
        }
      }
    }
    
    // All providers failed
    return generateDefaultDailyPlan(date, primaryProvider, getErrorMessage(error));
  }
  /* END AI SERVICE */
};

// Unified workload analysis with fallback
export const generateAIWorkloadAnalysis = async (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  schedulingData?: any,
  allowFallback: boolean = true
): Promise<AIServiceResult<WorkloadAnalysis>> => {
  // TEMPORARY: Disable AI calls to prevent 502 errors during development
  console.warn('AI Workload Analysis generation temporarily disabled to prevent 502 errors');
  console.log('Received params:', { projects: projects.length, tasks: tasks.length, userPreferences: !!userPreferences, schedulingData, allowFallback });
  return {
    data: generateDefaultWorkloadAnalysis('AI analysis temporarily disabled for development'),
    provider_used: 'disabled',
    success: true,
    error: undefined
  };

  const primaryProvider = userPreferences.ai_provider === 'gemini' ? 'claude' : userPreferences.ai_provider || 'claude';
  
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
      const analysis = await callWorkloadAnalysisProvider(fallbackProvider!, projects, tasks, userPreferences, schedulingData);
      return {
        data: analysis,
        provider_used: fallbackProvider!,
        success: true,
        fallback_used: true
      };
    } catch (error: unknown) {
      return {
        data: generateDefaultWorkloadAnalysis(`Fallback provider ${fallbackProvider!} failed`),
        provider_used: fallbackProvider!,
        success: false,
        error: getErrorMessage(error),
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
  } catch (error: unknown) {
    console.warn(`Primary provider ${primaryProvider} failed:`, error);
    
    // Try fallback if enabled
    if (allowFallback) {
      const fallbackProvider = getNextAvailableProvider(primaryProvider, userPreferences);
      
      if (fallbackProvider) {
        try {
          const analysis = await callWorkloadAnalysisProvider(fallbackProvider!, projects, tasks, userPreferences, schedulingData);
          return {
            data: analysis,
            provider_used: fallbackProvider!,
            success: true,
            fallback_used: true
          };
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider!} also failed:`, fallbackError);
        }
      }
    }
    
    // All providers failed
    return {
      data: generateDefaultWorkloadAnalysis(`AI analysis failed with ${primaryProvider}`),
      provider_used: primaryProvider,
      success: false,
      error: getErrorMessage(error)
    };
  }
  /* END AI SERVICE */
};

// Note: Provider-specific function calls moved to unified API approach

const callDailyPlanProvider = async (
  provider: string,
  date: Date,
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences,
  focusBlockData?: any[]
): Promise<DailyPlan> => {
  try {
    switch (provider) {
      case 'claude':
        return await generateClaudeDailyPlan(date, projects, tasks, userPreferences, focusBlockData);
      case 'openai':
        return await generateOpenAIDailyPlan(date, projects, tasks, userPreferences, focusBlockData);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error: any) {
    // Enhanced error handling for specific HTTP status codes
    if (error.message?.includes('502') || error.status === 502) {
      throw new Error('AI service is temporarily unavailable (502 Bad Gateway). Please try again later.');
    }
    if (error.message?.includes('503') || error.status === 503) {
      throw new Error('AI service is currently unavailable (503 Service Unavailable). Please check your configuration.');
    }
    if (error.message?.includes('timeout')) {
      throw new Error('Request timed out. The AI service may be experiencing delays.');
    }
    
    // Re-throw original error if not a known HTTP status
    throw error;
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

const generateDefaultWorkloadAnalysis = (_reason: string): WorkloadAnalysis => {
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
      mitigation_strategies: [`AI analysis temporarily disabled to prevent 502 errors during development`]
    },
    work_life_balance: {
      business_hours_utilization: 0,
      personal_time_protection: 100,
      context_switching_frequency: 0,
      balance_score: 50,
      improvement_suggestions: ['AI workload analysis will be re-enabled once backend API issues are resolved.']
    },
    efficiency_metrics: {
      task_completion_velocity: 0,
      priority_alignment_score: 0,
      energy_utilization_efficiency: 0,
      focus_time_percentage: 0,
      multitasking_overhead: 0
    },
    strategic_recommendations: ['AI services temporarily disabled for development stability.']
  };
};

// Provider health check and diagnostics
export const checkAIProviderHealth = async (userPreferences: UserPreferences): Promise<{
  providers: Record<string, { available: boolean; configured: boolean; error?: string; debug?: string }>;
  primary_provider: string;
  fallback_available: boolean;
}> => {
  const providers: Record<string, { available: boolean; configured: boolean; error?: string; debug?: string }> = {};
  
  // Check Gemini - mark as deprecated
  providers.gemini = {
    available: false,
    configured: false,
    error: 'Gemini has been deprecated. Please use Claude or OpenAI.',
    debug: 'Service discontinued'
  };
  
  // Check Claude - consider configured if API key is present
  const claudeConfigured = !!(userPreferences.claude_api_key);
  const claudeAvailable = checkProviderAvailability('claude', userPreferences);
  providers.claude = {
    available: claudeAvailable,
    configured: claudeConfigured,
    error: !claudeConfigured ? 'API key not configured' : (!claudeAvailable ? 'API key invalid or service unavailable' : undefined),
    debug: `API Key: ${userPreferences.claude_api_key ? `Present (${userPreferences.claude_api_key.substring(0, 8)}...)` : 'Missing'}`
  };
  
  // Check OpenAI - consider configured if API key is present
  const openaiConfigured = !!(userPreferences.openai_api_key);
  const openaiAvailable = checkProviderAvailability('openai', userPreferences);
  providers.openai = {
    available: openaiAvailable,
    configured: openaiConfigured,
    error: !openaiConfigured ? 'API key not configured' : (!openaiAvailable ? 'API key invalid or service unavailable' : undefined),
    debug: `API Key: ${userPreferences.openai_api_key ? `Present (${userPreferences.openai_api_key.substring(0, 8)}...)` : 'Missing'}`
  };
  
  // Auto-migrate from Gemini to Claude
  const effectivePrimaryProvider = userPreferences.ai_provider === 'gemini' ? 'claude' : userPreferences.ai_provider;
  const fallbackAvailable = !!getNextAvailableProvider(effectivePrimaryProvider, userPreferences);
  
  return {
    providers,
    primary_provider: effectivePrimaryProvider,
    fallback_available: fallbackAvailable
  };
};

// Export interface types for use in components
export type { DailyPlan, WorkloadAnalysis }; 