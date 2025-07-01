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
    const { projects, tasks } = req.body;

    // Validate required data
    if (!projects || !tasks) {
      return res.status(400).json({ error: 'Projects and tasks are required' });
    }

    // Get API key from environment variables
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

    // Construct the prompt for Claude
    const prompt = `You are an AI assistant helping with project management insights. Based on the following data, provide actionable insights and recommendations.

PROJECTS:
${JSON.stringify(projects, null, 2)}

TASKS:
${JSON.stringify(tasks, null, 2)}

Please provide insights in the following JSON format:
{
  "blocked_tasks": [
    {
      "task_id": "string",
      "title": "string", 
      "description": "string",
      "blocking_reason": "string",
      "suggested_action": "string"
    }
  ],
  "project_priorities": [
    {
      "project_id": "string",
      "title": "string",
      "description": "string", 
      "priority_score": number,
      "justification": "string"
    }
  ],
  "recommendations": [
    {
      "type": "string",
      "title": "string",
      "description": "string",
      "impact": "high" | "medium" | "low"
    }
  ]
}`;

    // Make the API call to Claude
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
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to get insights from Claude',
        details: errorData 
      });
    }

    const data = await response.json();
    
    // Extract the content from Claude's response
    const content = data.content?.[0]?.text;
    if (!content) {
      return res.status(500).json({ error: 'Invalid response from Claude API' });
    }

    // Try to parse the JSON response
    try {
      const insights = JSON.parse(content);
      res.status(200).json(insights);
    } catch (parseError) {
      // If JSON parsing fails, return the raw content
      res.status(200).json({
        blocked_tasks: [],
        project_priorities: [],
        recommendations: [
          {
            type: "parsing_error",
            title: "Response Parsing Issue",
            description: content,
            impact: "low"
          }
        ]
      });
    }

  } catch (error) {
    console.error('Error in claude-insights API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 