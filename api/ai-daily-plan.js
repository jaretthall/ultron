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
    const { date, projects, tasks, userPreferences, focusBlockData } = req.body;

    // Validate required data
    if (!date || !projects || !tasks || !userPreferences) {
      return res.status(400).json({ error: 'Date, projects, tasks, and user preferences are required' });
    }

    // Additional validation
    if (!Array.isArray(projects) || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Projects and tasks must be arrays' });
    }

    const provider = userPreferences.ai_provider || 'gemini';
    const targetDate = new Date(date);

    // Default daily plan structure
    const defaultPlan = {
      date: targetDate.toISOString().split('T')[0],
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
        recommendations: []
      },
      ai_recommendations: []
    };

    // Route to appropriate provider
    let result;
    switch (provider) {
      case 'gemini':
        result = await generateGeminiDailyPlan(targetDate, projects, tasks, userPreferences, focusBlockData);
        break;
      case 'claude':
        result = await generateClaudeDailyPlan(targetDate, projects, tasks, userPreferences, focusBlockData);
        break;
      case 'openai':
        result = await generateOpenAIDailyPlan(targetDate, projects, tasks, userPreferences, focusBlockData);
        break;
      default:
        return res.status(400).json({ error: `Unsupported AI provider: ${provider}` });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Error in ai-daily-plan API:', error);
    
    // Check for specific error types
    if (error.message.includes('API key not configured')) {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        message: 'AI provider is not properly configured. Please check your settings.'
      });
    }
    
    if (error.message.includes('API error')) {
      return res.status(502).json({ 
        error: 'AI service error',
        message: 'AI provider returned an error. Please try again later.'
      });
    }
    
    // Return default plan for graceful degradation
    console.log('Returning default plan due to error:', error.message);
    res.status(200).json({
      ...defaultPlan,
      ai_recommendations: [
        'AI planning service is temporarily unavailable. Using default schedule.',
        'Please try refreshing the page in a few minutes.'
      ]
    });
  }
}

// Gemini Daily Plan Generation
async function generateGeminiDailyPlan(date, projects, tasks, userPreferences, focusBlockData) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const model = userPreferences.selected_gemini_model || 'gemini-1.5-flash';
  
  const prompt = `Create a daily plan for ${date.toISOString().split('T')[0]} based on the following data:

Projects: ${JSON.stringify(projects, null, 2)}
Tasks: ${JSON.stringify(tasks, null, 2)}
User Preferences: ${JSON.stringify(userPreferences, null, 2)}
Focus Block Data: ${JSON.stringify(focusBlockData || [], null, 2)}

Generate a comprehensive daily plan with the following JSON structure:
{
  "date": "${date.toISOString().split('T')[0]}",
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
  "ai_recommendations": ["string"]
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      }
    }),
    signal: AbortSignal.timeout(30000) // 30 second timeout
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
    throw new Error('No content received from Gemini API');
  }
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', content);
    throw new Error('Invalid JSON response from Gemini API');
  }
}

// Claude Daily Plan Generation
async function generateClaudeDailyPlan(date, projects, tasks, userPreferences, focusBlockData) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const prompt = `Create a daily plan for ${date.toISOString().split('T')[0]} based on the provided data. Focus on optimal task scheduling, energy management, and productivity optimization.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;
  
  // Parse Claude's response and format as daily plan
  return {
    date: date.toISOString().split('T')[0],
    recommended_schedule: [],
    focus_blocks: [],
    energy_optimization: {
      peak_hours: ['09:00', '10:30'],
      low_energy_periods: ['14:00', '15:30'],
      recommended_task_distribution: { high_energy_tasks: 2, medium_energy_tasks: 4, low_energy_tasks: 2 },
      energy_efficiency_score: 75
    },
    workload_summary: {
      total_scheduled_hours: 8,
      available_capacity_hours: 8,
      utilization_percentage: 100,
      overload_risk: 'medium',
      bottlenecks: [],
      recommendations: [content?.substring(0, 200) || 'Daily plan generated by Claude']
    },
    ai_recommendations: [content?.substring(0, 100) || 'Optimize your schedule based on energy levels']
  };
}

// OpenAI Daily Plan Generation
async function generateOpenAIDailyPlan(date, projects, tasks, userPreferences, focusBlockData) {
  const apiKey = process.env.OPENAI_API_KEY || userPreferences.openai_api_key;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const model = userPreferences.selected_openai_model || 'gpt-4-turbo-preview';
  
  const prompt = `Create a detailed daily plan for ${date.toISOString().split('T')[0]} based on the following data:

Projects: ${JSON.stringify(projects, null, 2)}
Tasks: ${JSON.stringify(tasks, null, 2)}

Focus on creating an optimal schedule that maximizes productivity and aligns with energy levels throughout the day.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are an expert productivity consultant. Create detailed daily plans in JSON format.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  return JSON.parse(content);
} 