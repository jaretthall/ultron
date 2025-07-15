// Application constants
export const APP_VERSION = '3.2.3';

// AI Model configurations
export const AVAILABLE_GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable' },
  { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Stable version' }
];

export const AVAILABLE_CLAUDE_MODELS = [
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and affordable' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable' }
];

export const AVAILABLE_OPENAI_MODELS = [
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Latest GPT-4 model' }
];

// Application configuration
export const APP_CONFIG = {
  NAME: 'Ultron',
  DESCRIPTION: 'AI-Powered Productivity Command Center',
  VERSION: APP_VERSION,
  AUTHOR: 'Claude Code',
  REPOSITORY: 'https://github.com/user/ultron-productivity-command-center'
};

// Database configuration
export const DB_CONFIG = {
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  TIMEOUT: 30000
};

// UI configuration
export const UI_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280,
  ANIMATION_DURATION: 200
};