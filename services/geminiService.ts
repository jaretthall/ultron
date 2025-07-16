// Gemini service deprecated - keeping for backward compatibility only
import { Project, Task, StrategicInsights } from '../types';

// Deprecated: Gemini service is no longer supported
export const getGeminiInsights = async (
  _projects: Project[],
  _tasks: Task[],
  _apiKey?: string
): Promise<StrategicInsights> => {
  console.warn('Gemini service is deprecated. Please use Claude or OpenAI instead.');
  return {
    blocked_tasks: [],
    projects_needing_attention: [],
    focus_recommendations: ['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.'],
    priority_balance_score: 0,
  };
};

// All other functions moved to src/services/geminiService.ts or deprecated