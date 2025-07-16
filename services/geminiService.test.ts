import { generateStrategicInsights } from '../src/services/geminiService';
import { Project, Task, UserPreferences, AIProvider, ProjectStatus, ProjectContext, TaskPriority, TaskStatus, StrategicInsights } from '../types';
import { AVAILABLE_GEMINI_MODELS } from '../src/constants';


const mockDefaultUserPreferences: UserPreferences = {
  id: 'default_prefs_test',
  working_hours_start: "09:00", working_hours_end: "17:00",
  focus_block_duration: 90, break_duration: 15,
  priority_weight_deadline: 0.4, priority_weight_effort: 0.3, priority_weight_deps: 0.3,
  ai_provider: 'claude',
  selected_gemini_model: '', // deprecated
  // Ensure all required fields are present
  instructions: "Test instructions",
  business_hours_start: "09:00", business_hours_end: "17:00",
  business_days: ['mon'], personal_time_weekday_evening: true, personal_time_weekends: true,
  personal_time_early_morning: false, allow_business_in_personal_time: false, allow_personal_in_business_time: false,
  context_switch_buffer_minutes: 15, claude_api_key: '', openai_api_key: '',
  focus_blocks: [], preferred_time_slots: [], business_relevance_default: 50,
};

const mockProjects: Project[] = [
  { id: 'p1', title: 'Project Alpha', description: 'First project', goals: ['Goal 1'], status: ProjectStatus.ACTIVE, context: ProjectContext.BUSINESS, tags: ['test'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
const mockTasks: Task[] = [
  { id: 't1', title: 'Task 1', description: 'First task', priority: TaskPriority.HIGH, estimated_hours: 2, status: TaskStatus.TODO, dependencies: [], tags: ['test'], project_id: 'p1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

describe('geminiService - deprecated', () => {
  // constructPrompt function removed along with Gemini service deprecation

  describe('generateStrategicInsights', () => {
    it('should return deprecation warning for all cases', async () => {
      const insights = await generateStrategicInsights(mockProjects, mockTasks, mockDefaultUserPreferences);
      expect(insights.focus_recommendations).toEqual(['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.']);
      expect(insights.blocked_tasks).toEqual([]);
      expect(insights.projects_needing_attention).toEqual([]);
      expect(insights.priority_balance_score).toBe(0);
    });

    it('should return deprecation warning for Claude provider', async () => {
      const claudePrefs: UserPreferences = { ...mockDefaultUserPreferences, ai_provider: 'claude', claude_api_key: '' };
      const insights = await generateStrategicInsights(mockProjects, mockTasks, claudePrefs);
      expect(insights.focus_recommendations).toEqual(['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.']);
    });

    it('should return deprecation warning for OpenAI provider', async () => {
      const openaiPrefs: UserPreferences = { ...mockDefaultUserPreferences, ai_provider: 'openai', openai_api_key: '' };
      const insights = await generateStrategicInsights(mockProjects, mockTasks, openaiPrefs);
      expect(insights.focus_recommendations).toEqual(['Gemini service is no longer available. Please configure Claude or OpenAI in Settings.']);
    });

    it('should log deprecation warning to console', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      await generateStrategicInsights(mockProjects, mockTasks, mockDefaultUserPreferences);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Gemini service is deprecated. Please use Claude or OpenAI instead.');
      consoleWarnSpy.mockRestore();
    });
  });
});