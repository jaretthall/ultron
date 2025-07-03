/**
 * Environment Configuration Template
 * Copy this file and customize for your deployment environments
 * 
 * Phase 6.3: Deployment & CI/CD Configuration
 */

export const environmentConfig = {
  development: {
    app: {
      name: 'Ultron (Development)',
      env: 'development',
      version: process.env.VITE_APP_VERSION || '2.6.0',
      baseUrl: 'http://localhost:5173',
      enableDebug: true,
    },
    api: {
      supabaseUrl: process.env.VITE_SUPABASE_URL || 'your-dev-supabase-url',
      supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || 'your-dev-supabase-key',
    },
    ai: {
      geminiApiKey: process.env.VITE_GEMINI_API_KEY || '',
      openaiApiKey: process.env.VITE_OPENAI_API_KEY || '',
      claudeApiKey: process.env.VITE_CLAUDE_API_KEY || '',
    },
    features: {
      enableAnalytics: false,
      enableErrorReporting: true,
      enablePerformanceMonitoring: true,
      enableSecurityLogging: true,
      enablePWA: false,
      enableServiceWorker: false,
      enableOfflineMode: false,
    },
    security: {
      enableCSP: false,
      enableRateLimit: false,
      sessionTimeout: 7200000, // 2 hours
      corsOrigins: ['http://localhost:5173', 'http://localhost:4173'],
    },
    monitoring: {
      sentryDsn: '',
      analyticsId: '',
      enableConsoleLogging: true,
      logLevel: 'debug',
    },
  },

  staging: {
    app: {
      name: 'Ultron (Staging)',
      env: 'staging',
      version: process.env.VITE_APP_VERSION || '2.6.0',
      baseUrl: 'https://staging.ultron.app',
      enableDebug: false,
    },
    api: {
      supabaseUrl: process.env.VITE_SUPABASE_URL || 'your-staging-supabase-url',
      supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || 'your-staging-supabase-key',
    },
    ai: {
      geminiApiKey: process.env.VITE_GEMINI_API_KEY || '',
      openaiApiKey: process.env.VITE_OPENAI_API_KEY || '',
      claudeApiKey: process.env.VITE_CLAUDE_API_KEY || '',
    },
    features: {
      enableAnalytics: true,
      enableErrorReporting: true,
      enablePerformanceMonitoring: true,
      enableSecurityLogging: true,
      enablePWA: true,
      enableServiceWorker: true,
      enableOfflineMode: true,
    },
    security: {
      enableCSP: true,
      enableRateLimit: true,
      sessionTimeout: 3600000, // 1 hour
      corsOrigins: ['https://staging.ultron.app'],
    },
    monitoring: {
      sentryDsn: process.env.VITE_SENTRY_DSN || '',
      analyticsId: process.env.VITE_ANALYTICS_ID || '',
      enableConsoleLogging: false,
      logLevel: 'warn',
    },
  },

  production: {
    app: {
      name: 'Ultron',
      env: 'production',
      version: process.env.VITE_APP_VERSION || '2.6.0',
      baseUrl: 'https://ultron.app',
      enableDebug: false,
    },
    api: {
      supabaseUrl: process.env.VITE_SUPABASE_URL || 'your-production-supabase-url',
      supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || 'your-production-supabase-key',
    },
    ai: {
      geminiApiKey: process.env.VITE_GEMINI_API_KEY || '',
      openaiApiKey: process.env.VITE_OPENAI_API_KEY || '',
      claudeApiKey: process.env.VITE_CLAUDE_API_KEY || '',
    },
    features: {
      enableAnalytics: true,
      enableErrorReporting: true,
      enablePerformanceMonitoring: true,
      enableSecurityLogging: true,
      enablePWA: true,
      enableServiceWorker: true,
      enableOfflineMode: true,
    },
    security: {
      enableCSP: true,
      enableRateLimit: true,
      sessionTimeout: 3600000, // 1 hour
      corsOrigins: ['https://ultron.app'],
    },
    monitoring: {
      sentryDsn: process.env.VITE_SENTRY_DSN || '',
      analyticsId: process.env.VITE_ANALYTICS_ID || '',
      enableConsoleLogging: false,
      logLevel: 'error',
    },
    performance: {
      enableCompression: true,
      enableCaching: true,
      cdnUrl: process.env.VITE_CDN_URL || '',
      assetsBaseUrl: process.env.VITE_ASSETS_BASE_URL || '/',
    },
  },
};

/**
 * Get current environment configuration
 */
export const getCurrentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return environmentConfig[env] || environmentConfig.development;
};

/**
 * Validate environment configuration
 */
export const validateConfig = (config) => {
  const requiredFields = [
    'app.name',
    'app.env',
    'app.version',
    'api.supabaseUrl',
    'api.supabaseKey',
  ];

  const missing = requiredFields.filter(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], config);
    return !value || value.includes('your-');
  });

  if (missing.length > 0) {
    console.warn('Missing or incomplete environment configuration:', missing);
    return false;
  }

  return true;
};

export default environmentConfig; 