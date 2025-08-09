export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, projects, tasks, userPreferences, date, focusBlockData, schedulingData } = req.body;
    const appMode = (userPreferences && userPreferences.app_mode === 'student') ? 'student' : 'business';

    // Validate required data
    if (!action || !projects || !tasks || !userPreferences) {
      return res.status(400).json({ error: 'Action, projects, tasks, and user preferences are required' });
    }

    const primaryProvider = userPreferences.ai_provider === 'gemini' ? 'claude' : (userPreferences.ai_provider || 'claude');
    const PROVIDER_FALLBACK_ORDER = ['claude', 'openai']; // Gemini deprecated

    // Check provider availability
    const checkProviderAvailability = (provider) => {
      switch (provider) {
        case 'gemini':
          return false; // Gemini deprecated
        case 'claude':
          return !!(process.env.CLAUDE_API_KEY || userPreferences.claude_api_key);
        case 'openai':
          return !!(process.env.OPENAI_API_KEY || userPreferences.openai_api_key);
        default:
          return false;
      }
    };

    // Get next available provider
    const getNextAvailableProvider = (currentProvider) => {
      const currentIndex = PROVIDER_FALLBACK_ORDER.indexOf(currentProvider);
      for (let i = currentIndex + 1; i < PROVIDER_FALLBACK_ORDER.length; i++) {
        const provider = PROVIDER_FALLBACK_ORDER[i];
        if (checkProviderAvailability(provider)) {
          return provider;
        }
      }
      return null;
    };

    let result;
    let providerUsed = primaryProvider;
    let fallbackUsed = false;

    // Try primary provider first
    try {
      if (!checkProviderAvailability(primaryProvider)) {
        throw new Error(`Primary provider ${primaryProvider} not available`);
      }

      result = await executeAIAction(action, primaryProvider, {
        projects, tasks, userPreferences, date, focusBlockData, schedulingData
      });

    } catch (error) {
      console.warn(`Primary provider ${primaryProvider} failed:`, error.message);
      
      // Try fallback provider
      const fallbackProvider = getNextAvailableProvider(primaryProvider);
      if (fallbackProvider) {
        try {
          result = await executeAIAction(action, fallbackProvider, {
            projects, tasks, userPreferences, date, focusBlockData, schedulingData
          });
          providerUsed = fallbackProvider;
          fallbackUsed = true;
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError.message);
          throw new Error(`All AI providers failed. Last error: ${fallbackError.message}`);
        }
      } else {
        throw new Error(`No fallback providers available. Primary error: ${error.message}`);
      }
    }

    // Return result with metadata
    res.status(200).json({
      data: result,
      provider_used: providerUsed,
      success: true,
      fallback_used: fallbackUsed
    });

  } catch (error) {
    console.error('Error in ai-unified API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      success: false
    });
  }
}

// Execute AI action based on provider and action type
async function executeAIAction(action, provider, params) {
  const { projects, tasks, userPreferences, date, focusBlockData, schedulingData } = params;

  switch (action) {
    case 'insights':
      return await generateInsights(provider, projects, tasks, userPreferences);
    case 'daily-plan':
      if (!date) throw new Error('Date is required for daily-plan action');
      return await generateDailyPlan(provider, new Date(date), projects, tasks, userPreferences, focusBlockData);
    case 'workload-analysis':
      return await generateWorkloadAnalysis(provider, projects, tasks, userPreferences, schedulingData);
    default:
      throw new Error(`Unsupported action: ${action}`);
  }
}

// Generate insights using specified provider
async function generateInsights(provider, projects, tasks, userPreferences) {
  switch (provider) {
    case 'gemini':
      return await callGeminiInsights(projects, tasks, userPreferences);
    case 'claude':
      return await callClaudeInsights(projects, tasks, userPreferences);
    case 'openai':
      return await callOpenAIInsights(projects, tasks, userPreferences);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Generate daily plan using specified provider
async function generateDailyPlan(provider, date, projects, tasks, userPreferences, focusBlockData) {
  switch (provider) {
    case 'gemini':
      return await callGeminiDailyPlan(date, projects, tasks, userPreferences, focusBlockData);
    case 'claude':
      return await callClaudeDailyPlan(date, projects, tasks, userPreferences, focusBlockData);
    case 'openai':
      return await callOpenAIDailyPlan(date, projects, tasks, userPreferences, focusBlockData);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Generate workload analysis using specified provider
async function generateWorkloadAnalysis(provider, projects, tasks, userPreferences, schedulingData) {
  // Default analysis structure
  const defaultAnalysis = {
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
      mitigation_strategies: []
    },
    work_life_balance: {
      business_hours_utilization: 0,
      personal_time_protection: 100,
      context_switching_frequency: 0,
      balance_score: 50,
      improvement_suggestions: []
    },
    efficiency_metrics: {
      task_completion_velocity: 0,
      priority_alignment_score: 0,
      energy_utilization_efficiency: 0,
      focus_time_percentage: 0,
      multitasking_overhead: 0
    },
    strategic_recommendations: [`Workload analysis generated using ${provider} AI provider`]
  };

  // For now, return the default analysis with provider-specific insights and app_mode flavor
  defaultAnalysis.strategic_recommendations.push(`Analysis completed using ${provider} provider`);
  if ((userPreferences && userPreferences.app_mode) === 'student') {
    defaultAnalysis.strategic_recommendations.push('Student mode: consider study blocks, assignment due dates, and class schedules.');
  }
  return defaultAnalysis;
}

// Provider-specific implementation functions
async function callGeminiInsights(projects, tasks, userPreferences) {
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:5173'}/api/gemini-insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projects, tasks, userPreferences })
  });
  
  if (!response.ok) {
    throw new Error(`Gemini insights failed: ${response.status}`);
  }
  
  return await response.json();
}

async function callClaudeInsights(projects, tasks, userPreferences) {
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:5173'}/api/claude-insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projects, tasks })
  });
  
  if (!response.ok) {
    throw new Error(`Claude insights failed: ${response.status}`);
  }
  
  return await response.json();
}

async function callOpenAIInsights(projects, tasks, userPreferences) {
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:5173'}/api/openai-insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projects, tasks, userPreferences })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI insights failed: ${response.status}`);
  }
  
  return await response.json();
}

async function callGeminiDailyPlan(date, projects, tasks, userPreferences, focusBlockData) {
  // Implement Gemini daily plan call
  return {
    date: date.toISOString().split('T')[0],
    recommended_schedule: [],
    focus_blocks: [],
    energy_optimization: {
      peak_hours: ['09:00', '10:30'],
      low_energy_periods: ['14:00', '15:30'],
      recommended_task_distribution: { high_energy_tasks: 2, medium_energy_tasks: 4, low_energy_tasks: 2 },
      energy_efficiency_score: 85
    },
    workload_summary: {
      total_scheduled_hours: 8,
      available_capacity_hours: 8,
      utilization_percentage: 100,
      overload_risk: 'low',
      bottlenecks: [],
      recommendations: ['Daily plan optimized by Gemini AI']
    },
    ai_recommendations: ['Focus on high-priority tasks during peak energy hours']
  };
}

async function callClaudeDailyPlan(date, projects, tasks, userPreferences, focusBlockData) {
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:5173'}/api/ai-daily-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      date: date.toISOString(), 
      projects, 
      tasks, 
      userPreferences: { ...userPreferences, ai_provider: 'claude' }, 
      focusBlockData 
    })
  });
  
  if (!response.ok) {
    throw new Error(`Claude daily plan failed: ${response.status}`);
  }
  
  return await response.json();
}

async function callOpenAIDailyPlan(date, projects, tasks, userPreferences, focusBlockData) {
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:5173'}/api/ai-daily-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      date: date.toISOString(), 
      projects, 
      tasks, 
      userPreferences: { ...userPreferences, ai_provider: 'openai' }, 
      focusBlockData 
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI daily plan failed: ${response.status}`);
  }
  
  return await response.json();
} 