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
    const { projects, tasks, userPreferences } = req.body;

    // Validate required data
    if (!projects || !tasks || !userPreferences) {
      return res.status(400).json({ error: 'Projects, tasks, and user preferences are required' });
    }

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const model = userPreferences.selected_gemini_model || 'gemini-1.5-flash';

    // Construct the prompt for Gemini
    const simplifiedProjects = projects.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      goals: p.goals,
      deadline: p.deadline,
      context: p.context,
    }));

    const simplifiedTasks = tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      project_id: t.project_id,
    }));

    const prompt = `
    Analyze the following project and task data to provide strategic insights.
    
    Projects:
    ${JSON.stringify(simplifiedProjects, null, 2)}

    Tasks:
    ${JSON.stringify(simplifiedTasks, null, 2)}

    Based on this data, identify:
    1. Blocked Tasks: List tasks that are likely blocked by other incomplete tasks. For each, include:
        * task_id (string)
        * task_title (string)
        * blocking_task_ids (string[]) - IDs of tasks blocking this one
        * blocking_task_titles (string[]) - Titles of tasks blocking this one
        * reason (string) - Brief explanation of why it's considered blocked.
    2. Projects Needing Attention: List projects that require immediate attention due to factors like overdue tasks, high number of urgent tasks, or approaching deadlines with low completion. For each, include:
        * project_id (string)
        * project_title (string)
        * reason (string) - Why it needs attention.
    3. Focus Recommendations: Provide a list of 2-3 actionable focus recommendations for the next day/week. (string[])
    4. Priority Balance Score: A score from 0-100 indicating how well priorities are balanced across tasks and projects. (number)

    Return the response as a JSON object with the following structure:
    {
      "blocked_tasks": [{ "task_id": "...", "task_title": "...", "blocking_task_ids": [], "blocking_task_titles": [], "reason": "..." }],
      "projects_needing_attention": [{ "project_id": "...", "project_title": "...", "reason": "..." }],
      "focus_recommendations": ["...", "..."],
      "priority_balance_score": 75
    }
    `;

    // Make the API call to Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to get insights from Gemini',
        details: errorData 
      });
    }

    const data = await response.json();
    
    // Extract the content from Gemini's response
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return res.status(500).json({ error: 'Invalid response from Gemini API' });
    }

    // Try to parse the JSON response
    try {
      const insights = JSON.parse(content);
      res.status(200).json(insights);
    } catch (parseError) {
      // If JSON parsing fails, return a default structure
      res.status(200).json({
        blocked_tasks: [],
        projects_needing_attention: [],
        focus_recommendations: [content.substring(0, 200) + "..."],
        priority_balance_score: 50
      });
    }

  } catch (error) {
    console.error('Error in gemini-insights API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 