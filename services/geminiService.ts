import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Project, Task, StrategicInsights, UserPreferences } from '../types';
// GEMINI_MODEL_NAME from constants is now a default, actual model used can be passed in.

const API_KEY = process.env.API_KEY;

// Initialize AI client only if API_KEY is available
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

if (!API_KEY && (window as any).IS_DEVELOPMENT_MODE) { // You might set IS_DEVELOPMENT_MODE during local dev
  console.warn(
    "API_KEY environment variable not set. Gemini API features will be disabled."
  );
}


export const constructPrompt = (projects: Project[], tasks: Task[]): string => {
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
    due_date: t.due_date, // Corrected: was dueDate
    project_id: t.project_id, // Corrected: was projectId
  }));

  const prompt = `
    Analyze the following project and task data to provide strategic insights.
    
    Projects:
    ${JSON.stringify(simplifiedProjects, null, 2)}

    Tasks:
    ${JSON.stringify(simplifiedTasks, null, 2)}

    Based on this data, identify:
    1.  Blocked Tasks: List tasks that are likely blocked by other incomplete tasks. For each, include:
        *   task_id (string)
        *   task_title (string)
        *   blocking_task_ids (string[]) - IDs of tasks blocking this one
        *   blocking_task_titles (string[]) - Titles of tasks blocking this one
        *   reason (string) - Brief explanation of why it's considered blocked.
    2.  Projects Needing Attention: List projects that require immediate attention due to factors like overdue tasks, high number of urgent tasks, or approaching deadlines with low completion. For each, include:
        *   project_id (string)
        *   project_title (string)
        *   reason (string) - Why it needs attention.
    3.  Focus Recommendations: Provide a list of 2-3 actionable focus recommendations for the next day/week. (string[])
    4.  Priority Balance Score: A score from 0-100 indicating how well priorities are balanced across tasks and projects. (number)

    Return the response as a JSON object with the following structure:
    {
      "blocked_tasks": [{ "task_id": "...", "task_title": "...", "blocking_task_ids": [], "blocking_task_titles": [], "reason": "..." }],
      "projects_needing_attention": [{ "project_id": "...", "project_title": "...", "reason": "..." }],
      "focus_recommendations": ["...", "..."],
      "priority_balance_score": 75
    }
  `; // Matched JSON structure to snake_case from StrategicInsights type
  return prompt;
};

export const generateStrategicInsights = async (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences
): Promise<StrategicInsights> => {
  const defaultInsights: StrategicInsights = {
    blocked_tasks: [], // Corrected: was blockedTasks
    projects_needing_attention: [], // Corrected: was projectsNeedingAttention
    focus_recommendations: [], // Corrected: was focusRecommendations
    priority_balance_score: 0, // Corrected: was priorityBalanceScore
  };

  if (userPreferences.ai_provider === 'gemini') { // Corrected: was aiProvider
    if (!ai) {
      console.warn("Gemini API key not configured. Returning default insights.");
      defaultInsights.focus_recommendations = ["Configure Gemini API key for AI insights."]; // Corrected: was focusRecommendations
      return defaultInsights;
    }
    
    const modelToUse = userPreferences.selected_gemini_model; // Corrected: was selectedGeminiModel
    if (!modelToUse) {
        console.warn("No Gemini model selected in preferences. Returning default insights.");
        defaultInsights.focus_recommendations = ["Select a Gemini model in settings for AI insights."]; // Corrected: was focusRecommendations
        return defaultInsights;
    }

    const prompt = constructPrompt(projects, tasks);

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
          model: modelToUse,
          contents: prompt,
          config: {
              responseMimeType: "application/json",
          }
      });
      
      if (!response?.text) {
        console.warn('Empty response from Gemini API');
        return defaultInsights;
      }

      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      const insights = JSON.parse(jsonStr) as StrategicInsights;
      
      // Validate based on snake_case properties
      if (!insights.blocked_tasks || !insights.projects_needing_attention || !insights.focus_recommendations || insights.priority_balance_score === undefined) { // Corrected properties
          console.error("Parsed Gemini response is missing expected fields (snake_case):", insights);
          throw new Error("AI response format error: missing expected fields (snake_case).");
      }
      return insights;

    } catch (error) {
      console.error(`Error generating strategic insights from Gemini model ${modelToUse}:`, error);
      defaultInsights.focus_recommendations = ["Error fetching AI insights. Check console."]; // Corrected:
      return defaultInsights;
    }
  } else if (userPreferences.ai_provider === 'claude') { // Corrected: was aiProvider
    console.warn("Claude AI provider selected, but integration is not yet fully implemented. Returning default insights.");
    defaultInsights.focus_recommendations = ["Claude integration not yet available."]; // Corrected: was focusRecommendations
    if (!userPreferences.claude_api_key) { // Corrected: was claudeApiKey
        defaultInsights.focus_recommendations.push("Claude API Key not configured in settings."); // Corrected: was focusRecommendations
    }
    return defaultInsights;
  } else if (userPreferences.ai_provider === 'openai') { // Corrected: was aiProvider
    console.warn("OpenAI provider selected, but integration is not yet fully implemented. Returning default insights.");
    defaultInsights.focus_recommendations = ["OpenAI integration not yet available."]; // Corrected: was focusRecommendations
    if (!userPreferences.openai_api_key) { // Corrected: was openaiApiKey
        defaultInsights.focus_recommendations.push("OpenAI API Key not configured in settings."); // Corrected: was focusRecommendations
    }
    return defaultInsights;
  }

  console.warn(`Unknown AI provider: ${userPreferences.ai_provider}. Returning default insights.`); // Corrected: was aiProvider
  return defaultInsights;
};