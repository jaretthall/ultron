export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17"; // Default, might be superseded by user preference
export const APP_NAME = "Ultron";
export const APP_VERSION = "2.7.4";

export const VERSION_CHANGELOG = {
  "2.7.4": {
    date: "2025-01-20",
    changes: [
      "Improved font contrast across white background sections in AI Dashboard",
      "Enhanced text readability by changing gray-600 to gray-700/gray-800 on white backgrounds",
      "Fixed provider health indicator text contrast for better accessibility",
      "Updated all white background cards to use darker text colors",
      "Improved overall UI accessibility and WCAG compliance for text contrast"
    ]
  },
  "2.7.3": {
    date: "2025-01-20",
    changes: [
      "Fixed AI provider configuration status detection issue",
      "Added Claude model selection options (Claude 3.5 Sonnet, Claude 3.5 Haiku, etc.)",
      "Added OpenAI model selection options (GPT-4o, GPT-4 Turbo, etc.)",
      "Enhanced AI provider health checking to properly validate API keys and models",
      "Improved AI Dashboard configuration status accuracy",
      "Added comprehensive model support for all AI providers in settings"
    ]
  },
  "2.7.2": {
    date: "2025-01-20",
    changes: [
      "Added comprehensive Docker deployment infrastructure for standalone containerized deployment",
      "Created PowerShell and Bash deployment scripts for easy one-click container setup",
      "Added Docker Compose configuration for simplified standalone application deployment",
      "Enhanced deployment documentation with comprehensive Docker deployment guide",
      "Implemented production-ready containerization with health checks and auto-restart capabilities",
      "Added monitoring and security features for containerized deployment environments"
    ]
  },
  "2.7.1": {
    date: "2025-01-20",
    changes: [
      "Added functional project context filtering dropdown on Projects page",
      "Projects can now be filtered by Business, Personal, or All contexts",
      "Implemented dropdown UI with click-outside-to-close functionality",
      "Enhanced project navigation and organization with real-time filtering",
      "Improved user experience for managing different project contexts"
    ]
  },
  "2.7.0": {
    date: "2025-01-20",
    changes: [
      "🎉 PHASE 6 COMPLETE: Production Readiness - Full Deployment Infrastructure",
      "✅ Created comprehensive CI/CD pipeline with GitHub Actions",
      "✅ Implemented multi-stage Docker deployment with security optimizations",
      "✅ Added Nginx configuration with security headers and performance caching",
      "✅ Enhanced Vite configuration with PWA support and production optimizations",
      "✅ Created environment configuration templates for all deployment stages",
      "✅ Integrated Lighthouse CI for automated performance monitoring",
      "✅ Added Docker Compose for local development and production deployment",
      "✅ Implemented comprehensive build optimization with chunk splitting",
      "✅ Added security scanning and dependency auditing to CI/CD pipeline",
      "🚀 APPLICATION IS NOW PRODUCTION-READY FOR ENTERPRISE DEPLOYMENT"
    ]
  },
  "2.6.0": {
    date: "2025-01-20",
    changes: [
      "🚀 PHASE 6: Production Readiness - Security & Monitoring System",
      "✅ Integrated comprehensive security validation with InputValidator for all forms",
      "✅ Added MonitoringService with error tracking, performance metrics, and user analytics",
      "✅ Enhanced ErrorBoundary with automatic error reporting and unique error IDs",
      "✅ Implemented security headers, input sanitization, and OWASP compliance measures",
      "✅ Added user interaction tracking for improved UX insights and debugging",
      "✅ Created SecureStorage utilities and CSRF protection mechanisms",
      "✅ Enhanced form validation in NewTaskModal with security best practices",
      "✅ Integrated rate limiting and security logging capabilities"
    ]
  },
  "2.5.23": {
    date: "2025-01-20",
    changes: [
      "Fixed critical infinite re-render loop in AppStateContext that was preventing form inputs from working",
      "Added missing isAuthenticated dependency to loadInitialData useCallback",
      "Optimized NewTaskModal component with useMemo for availableProjects to reduce unnecessary re-renders",
      "Resolved 'Maximum update depth exceeded' errors and improved app stability",
      "Enhanced form input functionality and user interaction responsiveness"
    ]
  },
  "2.5.20": {
    date: "2025-01-20",
    changes: [
      "Implemented comprehensive notification system with intelligent deadline tracking",
      "Added notification center with deadline warnings, productivity insights, and urgent task alerts",
      "Created advanced responsive layout system for optimal mobile and tablet experience",
      "Added mobile-first responsive components with touch-optimized interfaces",
      "Enhanced header with notification bell and real-time notification count badges",
      "Implemented adaptive layouts that automatically adjust to different screen sizes"
    ]
  },
  "2.5.19": {
    date: "2025-01-20",
    changes: [
      "Implemented Global Search with Cmd/Ctrl+K keyboard shortcut",
      "Added intelligent search across projects, tasks, and tags with relevance scoring",
      "Enhanced search with keyboard navigation (arrow keys, Enter, Escape)",
      "Added visual search results with icons, priority indicators, and context information",
      "Integrated search result navigation to open projects, tasks, or filter by tags",
      "Improved overall application intelligence and user experience"
    ]
  },
  "2.5.18": {
    date: "2025-01-20",
    changes: [
      "Rebranded application from 'Duecex' to 'Ultron' (AI Productivity Command Center)",
      "Implemented comprehensive visual analytics with progress rings and bar charts",
      "Added CSV and HTML performance report export functionality",
      "Created intelligent performance report generator with AI-driven insights",
      "Enhanced analytics dashboard with executive summaries, strengths, and recommendations",
      "Added visual trend indicators and comprehensive data visualization components"
    ]
  },
  "2.5.17": {
    date: "2025-01-20",
    changes: [
      "Enhanced analytics service with advanced productivity metrics",
      "Added productivity score, focus time utilization, and task velocity tracking",
      "Implemented burnout risk assessment and context switch frequency analysis",
      "Added performance insights with bottleneck analysis and AI improvement suggestions",
      "Enhanced workload analysis with energy level distribution and top performing days",
      "Improved analytics dashboard with comprehensive performance visualization"
    ]
  },
  "2.5.16": {
    date: "2025-01-20",
    changes: [
      "Enhanced analytics dashboard with gradient cards and improved UI",
      "Added export functionality for analytics data and workspace snapshots",
      "Implemented JSON download capabilities for data portability",
      "Added export status indicators and error handling",
      "Improved visual design with hover effects and better color schemes"
    ]
  },
  "2.5.15": {
    date: "2025-01-20",
    changes: [
      "Added analytics preview section to home dashboard",
      "Integrated productivity insights with completion rates and goal tracking",
      "Added 'View Full Analytics' navigation link to dedicated analytics page"
    ]
  },
  "2.5.14": {
    date: "2025-01-20", 
    changes: [
      "Added analytics navigation route and placeholder page",
      "Integrated analytics service infrastructure", 
      "Updated navigation with analytics link"
    ]
  },
};

export const AVAILABLE_GEMINI_MODELS = [
  { id: "gemini-2.5-flash-preview-04-17", name: "Gemini 2.5 Flash (Preview)" },
  // Add other compatible Gemini models here if needed in the future
  // { id: "gemini-pro-vision", name: "Gemini Pro Vision" }, // Example, ensure compatibility
];

export const AVAILABLE_CLAUDE_MODELS = [
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
  { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
];

export const AVAILABLE_OPENAI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
];
