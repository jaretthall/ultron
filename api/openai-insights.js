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

    // Get API key from environment variables or user preferences
    const apiKey = process.env.OPENAI_API_KEY || userPreferences.openai_api_key;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const model = userPreferences.selected_openai_model || 'gpt-4-turbo-preview';

    // Construct the prompt for OpenAI
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

    const systemMessage = 'You are an expert productivity consultant and project management advisor. Provide precise, actionable insights in the requested JSON format.';
    
    const userMessage = `
    Analyze the following project and task data to provide strategic insights.
    
    Projects:
    ${JSON.stringify(simplifiedProjects, null, 2)}

    Tasks:
    ${JSON.stringify(simplifiedTasks, null, 2)}

    Based on this data, provide insights focusing on:
    1. Blocked tasks that depend on other incomplete tasks
    2. Projects requiring immediate attention
    3. Strategic recommendations for productivity optimization

    Return the response as a JSON object with the following structure:
    {
      "blocked_tasks": [{ "id": "...", "title": "...", "description": "...", "project_id": "...", "priority": "...", "due_date": "...", "status": "..." }],
      "projects_needing_attention": [{ "id": "...", "title": "...", "description": "...", "status": "...", "deadline": "..." }],
      "recommendations": ["...", "..."]
    }
    `;

    // Make the API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to get insights from OpenAI',
        details: errorData 
      });
    }

    const data = await response.json();
    
    // Extract the content from OpenAI's response
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'Invalid response from OpenAI API' });
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
        recommendations: [content.substring(0, 200) + "..."]
      });
    }

  } catch (error) {
    console.error('Error in openai-insights API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 