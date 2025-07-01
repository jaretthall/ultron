
import React, { useState, useEffect } from 'react';
import { UserPreferences, AIProvider } from '../../../types';
import { AVAILABLE_GEMINI_MODELS, AVAILABLE_CLAUDE_MODELS, AVAILABLE_OPENAI_MODELS } from '../../../constants';
import { useAppState } from '../../contexts/AppStateContext';
import TagManager from '../tags/TagManager';

const SettingsPage: React.FC = () => {
  const { state, updateUserPreferences } = useAppState();
  const { userPreferences } = state;

  const [activeTab, setActiveTab] = useState('AI Provider');
  const [currentAiProvider, setCurrentAiProvider] = useState<AIProvider>(userPreferences?.ai_provider || 'gemini');
  const [currentSelectedGeminiModel, setCurrentSelectedGeminiModel] = useState<string>(userPreferences?.selected_gemini_model || 'gemini-2.5-flash-preview-04-17');
  const [currentClaudeApiKey, setCurrentClaudeApiKey] = useState<string>(userPreferences?.claude_api_key || '');
  const [currentSelectedClaudeModel, setCurrentSelectedClaudeModel] = useState<string>(userPreferences?.selected_claude_model || 'claude-3-5-sonnet-20241022');
  const [currentOpenaiApiKey, setCurrentOpenaiApiKey] = useState<string>(userPreferences?.openai_api_key || '');
  const [currentSelectedOpenaiModel, setCurrentSelectedOpenaiModel] = useState<string>(userPreferences?.selected_openai_model || 'gpt-4o');
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  useEffect(() => {
    if (userPreferences) {
      setCurrentAiProvider(userPreferences.ai_provider);
      setCurrentSelectedGeminiModel(userPreferences.selected_gemini_model);
      setCurrentClaudeApiKey(userPreferences.claude_api_key || '');
      setCurrentSelectedClaudeModel(userPreferences.selected_claude_model || 'claude-3-5-sonnet-20241022');
      setCurrentOpenaiApiKey(userPreferences.openai_api_key || '');
      setCurrentSelectedOpenaiModel(userPreferences.selected_openai_model || 'gpt-4o');
    }  
  }, [userPreferences]);


  const tabs = ['AI Provider', 'Preferences', 'Sync', 'Security', 'Integrations', 'Advanced', 'Notes'];

  const isGeminiClientInitialized = !(process.env.API_KEY === undefined || process.env.API_KEY === '');

  const handleSaveChanges = () => {
    const updatedPrefs: Partial<UserPreferences> = {
        ai_provider: currentAiProvider,
        selected_gemini_model: currentSelectedGeminiModel,
        claude_api_key: currentClaudeApiKey,
        selected_claude_model: currentSelectedClaudeModel,
        openai_api_key: currentOpenaiApiKey,
        selected_openai_model: currentSelectedOpenaiModel,
    };
    updateUserPreferences(updatedPrefs);
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'AI Provider':
        return (
          <section className="p-6 bg-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-6 text-slate-100">AI Provider Configuration</h3>

            <div className="space-y-6">
              <div>
                <label htmlFor="aiProvider" className="block text-sm font-medium text-slate-300 mb-1">Choose AI Provider</label>
                <select
                  id="aiProvider"
                  value={currentAiProvider}
                  onChange={(e) => setCurrentAiProvider(e.target.value as AIProvider)}
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="claude">Anthropic Claude (Experimental)</option>
                  <option value="openai">OpenAI GPT (Experimental)</option>
                </select>
              </div>

              {currentAiProvider === 'gemini' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Google Gemini API Key</label>
                    {isGeminiClientInitialized ? (
                      <p className="text-sm text-emerald-400 p-3 bg-emerald-900/50 border border-emerald-700 rounded-md">
                        Gemini API Key is configured via environment variable (`process.env.API_KEY`).
                      </p>
                    ) : (
                      <p className="text-sm text-yellow-400 p-3 bg-yellow-900/50 border border-yellow-700 rounded-md">
                        Google Gemini API Key is not configured. AI features for Gemini will be disabled. Set `API_KEY` in your environment.
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="geminiModel" className="block text-sm font-medium text-slate-300 mb-1">Preferred Gemini Model</label>
                    <select
                      id="geminiModel"
                      value={currentSelectedGeminiModel}
                      onChange={(e) => setCurrentSelectedGeminiModel(e.target.value)}
                      className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                      disabled={!isGeminiClientInitialized}
                    >
                      {AVAILABLE_GEMINI_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    {!isGeminiClientInitialized && <p className="text-xs text-yellow-500 mt-1">Model selection disabled as Gemini API key is not configured.</p>}
                  </div>
                </>
              )}

              {currentAiProvider === 'claude' && (
                <>
                  <div>
                    <label htmlFor="claudeApiKey" className="block text-sm font-medium text-slate-300 mb-1">Anthropic Claude API Key</label>
                    <input
                      type="password"
                      id="claudeApiKey"
                      value={currentClaudeApiKey}
                      onChange={(e) => setCurrentClaudeApiKey(e.target.value)}
                      placeholder="Enter your Claude API Key"
                      className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                      aria-label="Anthropic Claude API Key"
                    />
                    <p className="text-xs text-slate-500 mt-1">Claude integration is experimental and not yet fully functional.</p>
                  </div>
                  <div>
                    <label htmlFor="claudeModel" className="block text-sm font-medium text-slate-300 mb-1">Preferred Claude Model</label>
                    <select
                      id="claudeModel"
                      value={currentSelectedClaudeModel}
                      onChange={(e) => setCurrentSelectedClaudeModel(e.target.value)}
                      className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                      disabled={!currentClaudeApiKey}
                    >
                      {AVAILABLE_CLAUDE_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    {!currentClaudeApiKey && <p className="text-xs text-slate-500 mt-1">Model selection disabled until API key is configured.</p>}
                  </div>
                </>
              )}

              {currentAiProvider === 'openai' && (
                <>
                  <div>
                    <label htmlFor="openaiApiKey" className="block text-sm font-medium text-slate-300 mb-1">OpenAI API Key</label>
                    <input
                      type="password"
                      id="openaiApiKey"
                      value={currentOpenaiApiKey}
                      onChange={(e) => setCurrentOpenaiApiKey(e.target.value)}
                      placeholder="Enter your OpenAI API Key"
                      className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                      aria-label="OpenAI API Key"
                    />
                    <p className="text-xs text-slate-500 mt-1">OpenAI integration is experimental and not yet fully functional.</p>
                  </div>
                  <div>
                    <label htmlFor="openaiModel" className="block text-sm font-medium text-slate-300 mb-1">Preferred OpenAI Model</label>
                    <select
                      id="openaiModel"
                      value={currentSelectedOpenaiModel}
                      onChange={(e) => setCurrentSelectedOpenaiModel(e.target.value)}
                      className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                      disabled={!currentOpenaiApiKey}
                    >
                      {AVAILABLE_OPENAI_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    {!currentOpenaiApiKey && <p className="text-xs text-slate-500 mt-1">Model selection disabled until API key is configured.</p>}
                  </div>
                </>
              )}
                 <button
                    onClick={handleSaveChanges}
                    className="mt-6 w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm"
                  >
                    Save AI Preferences
                  </button>
            </div>
          </section>
        );
      case 'Preferences':
        return (
          <section className="p-6 bg-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-slate-100">Application Preferences</h3>
            <p className="text-slate-400">Customize your workspace behavior. (More preferences to be added here)</p>
            <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-300">Working Hours Start: <span className="font-medium text-slate-100">{userPreferences.working_hours_start}</span></p> {/* Corrected */}
                <p className="text-sm text-slate-300">Working Hours End: <span className="font-medium text-slate-100">{userPreferences.working_hours_end}</span></p> {/* Corrected */}
                <p className="text-sm text-slate-300">Focus Block Duration: <span className="font-medium text-slate-100">{userPreferences.focus_block_duration} minutes</span></p>
            </div>
          </section>
        );
      case 'Sync':
         return (
          <>
            <section className="mb-8 p-6 bg-slate-800 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-100">Tag & Category Management</h3>
                    <button 
                      onClick={() => setIsTagManagerOpen(true)}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Manage Tags & Categories
                    </button>
                </div>
                <div className="space-y-3">
                  <p className="text-slate-400">
                    Organize your projects and tasks with a comprehensive tagging system. 
                    Create categories, manage tags, and analyze usage patterns.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-slate-700 p-3 rounded">
                      <h4 className="font-medium text-slate-100 mb-1">Create & Edit Tags</h4>
                      <p className="text-slate-400">Add custom tags with colors and categories</p>
                    </div>
                    <div className="bg-slate-700 p-3 rounded">
                      <h4 className="font-medium text-slate-100 mb-1">Tag Analytics</h4>
                      <p className="text-slate-400">View usage statistics and cleanup suggestions</p>
                    </div>
                    <div className="bg-slate-700 p-3 rounded">
                      <h4 className="font-medium text-slate-100 mb-1">Category Organization</h4>
                      <p className="text-slate-400">Group tags into meaningful categories</p>
                    </div>
                  </div>
                </div>
            </section>

            <section className="p-6 bg-slate-800 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-slate-100">Backup & Data Management</h3>
              <p className="text-slate-400">Data backup and restore options will be available here.</p>
            </section>
          </>
        );
      default:
        return (
            <section className="p-6 bg-slate-800 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-slate-100">{activeTab} Settings</h3>
                <p className="text-slate-400">Configuration for {activeTab} is under development.</p>
            </section>
        );
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-900 text-slate-100">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-400 mt-1">Manage your account and application preferences.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-1/5 space-y-1 shrink-0" aria-label="Settings Tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                ${activeTab === tab ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>

      {/* Tag Manager Modal */}
      {isTagManagerOpen && (
        <TagManager onClose={() => setIsTagManagerOpen(false)} />
      )}
    </div>
  );
};

export default SettingsPage;
