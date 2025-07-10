# Ultron - AI-Powered Productivity Command Center

## Current Version: 3.0.8

A React-based productivity application with AI integration, task management, and real-time collaboration features.

## Quick Start

```bash
npm install
npm run dev
```

## Project Structure

```
├── src/                    # Source code
│   ├── components/         # React components
│   ├── contexts/          # React Context providers
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── lib/                   # External service configurations
├── docs/                  # Documentation
├── scripts/               # Build and utility scripts
├── archive/               # Archived files and legacy code
└── cypress/               # End-to-end tests
```

## Documentation

- [Product Requirements](docs/prd.md)
- [Development Log](docs/claude.md)
- [AI Integration](docs/gemini.md)
- [Full Documentation](docs/README.md)

## Key Features

- ✅ Project and Task Management
- ✅ AI-powered insights and analytics
- ✅ Multi-provider AI support (Gemini, Claude, OpenAI)
- ✅ Real-time collaboration
- ✅ Responsive design with mobile support
- ✅ Advanced settings and customization

## Technology Stack

- **Frontend:** React 19.1.0, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Real-time, Auth)
- **AI Services:** Google Gemini, Claude, OpenAI
- **Deployment:** Vercel with GitHub Actions

## Environment Variables

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_key
CLAUDE_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run type-check` - Type checking

## Support

For issues and questions, check the [development log](docs/claude.md) or create an issue in the repository.