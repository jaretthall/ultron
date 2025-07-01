
import React, { useState } from 'react';
import { UserPreferences, AIProvider } from '../../types';
import { AVAILABLE_GEMINI_MODELS } from '../../constants';

interface SettingsPageProps {
  userPreferences: UserPreferences | null;
  onUpdatePreferences: (updatedPrefs: Partial<UserPreferences>) => void; // Callback to update preferences in App state
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userPreferences, onUpdatePreferences }) => {
  const [activeTab, setActiveTab] = useState('AI Provider'); // Default to AI Provider tab
  
  // Local state for form inputs - this allows editing before "saving"
  // Initialize with prop values or defaults
  const [currentAiProvider, setCurrentAiProvider] = useState<AIProvider>(userPreferences?.ai_provider || 'gemini');
  const [currentSelectedGeminiModel, setCurrentSelectedGeminiModel] = useState<string>(userPreferences?.selected_gemini_model || 'gemini-1.5-flash');
  const [currentClaudeApiKey, setCurrentClaudeApiKey] = useState<string>(userPreferences?.claude_api_key || '');
  const [currentOpenaiApiKey, setCurrentOpenaiApiKey] = useState<string>(userPreferences?.openai_api_key || '');

  // Show loading if userPreferences is not yet available
  if (!userPreferences) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-900 text-slate-100">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = ['AI Provider', 'Preferences', 'Sync', 'Security', 'Integrations', 'Advanced', 'Notes'];

  // This check is simplified: it reflects if the app's Gemini client was initialized.
  // The actual API_KEY is in process.env, not directly accessible here.
  // The geminiService handles null `ai` object if API_KEY is missing.
  const isGeminiClientInitialized = !(process.env.API_KEY === undefined || process.env.API_KEY === '');


  const handleSaveChanges = () => {
    onUpdatePreferences({
        ai_provider: currentAiProvider,
        selected_gemini_model: currentSelectedGeminiModel,
        claude_api_key: currentClaudeApiKey,
        openai_api_key: currentOpenaiApiKey,
        // Add other preference fields here as they become editable
    });
    // alert("Settings saved (locally for now)!"); // Or provide better feedback
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
                <div>
                  <label htmlFor="claudeApiKey" className="block text-sm font-medium text-slate-300 mb-1">Anthropic Claude API Key</label>
                  <input
                    type="password"
                    id="claudeApiKey"
                    value={currentClaudeApiKey}
                    onChange={(e) => setCurrentClaudeApiKey(e.target.value)}
                    placeholder="Enter your Claude API Key"
                    className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                  />
                   <p className="text-xs text-slate-500 mt-1">Claude integration is experimental and not yet fully functional.</p>
                </div>
              )}

              {currentAiProvider === 'openai' && (
                <div>
                  <label htmlFor="openaiApiKey" className="block text-sm font-medium text-slate-300 mb-1">OpenAI API Key</label>
                  <input
                    type="password"
                    id="openaiApiKey"
                    value={currentOpenaiApiKey}
                    onChange={(e) => setCurrentOpenaiApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API Key"
                    className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2.5 focus:ring-sky-500 focus:border-sky-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">OpenAI integration is experimental and not yet fully functional.</p>
                </div>
              )}
            </div>
          </section>
        );
      case 'Preferences':
        return (
          <section className="p-6 bg-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-slate-100">Application Preferences</h3>
            <p className="text-slate-400">Customize your workspace behavior. (More preferences to be added here)</p>
            <div className="mt-4">
                <p className="text-sm text-slate-300">Working Hours Start: {userPreferences!.working_hours_start}</p>
                <p className="text-sm text-slate-300">Working Hours End: {userPreferences!.working_hours_end}</p>
                {/* Add more editable preferences here with inputs bound to local state and saved via onUpdatePreferences */}
            </div>
          </section>
        );
      case 'Sync': 
         return (
          <>
            <section className="mb-8 p-6 bg-slate-800 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-100">Tag & Category Management</h3>
                    <button className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium py-2 px-4 rounded-md">
                        Manage Tag Categories (Soon)
                    </button>
                </div>
                <p className="text-slate-400 mb-2">Tag management features are under development.</p>
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
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-400 mt-1">Manage your account and application preferences.</p>
        </div>
        <button 
            onClick={handleSaveChanges}
            className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
        >
          Save AI Preferences
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-1/5 space-y-1 shrink-0" aria-label="Tabs">
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
    </div>
  );
};

export default SettingsPage;
