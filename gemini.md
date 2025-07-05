# Gemini Agent Instructions

## Project Overview

Ultron is a comprehensive AI-powered productivity command center that combines project management, task tracking, calendar integration, and intelligent insights to help users optimize their workflow and achieve better work-life balance.

### Key Features

- **Smart Task Management**: AI-assisted priority optimization and dependency tracking.
- **Project Dashboard**: Real-time progress visualization and strategic insights.
- **AI Integration**: Utilizes Gemini, Claude, and OpenAI for intelligent recommendations.
- **Calendar Integration**: Manages working hours and focus block scheduling.
- **Analytics Dashboard**: Tracks performance and productivity insights.
- **Global Search**: Intelligent search across all entities with keyboard shortcuts.
- **Secure Authentication**: Supabase Auth with Row Level Security (RLS).

### Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI Services**: Serverless functions for Gemini, Claude, and OpenAI
- **Testing**: Jest (unit/integration), Cypress (E2E)
- **Deployment**: Vercel (recommended), Docker, or standalone server

## Agent Instructions & Limitations

### Environment Variables

As the AI agent, Gemini, you are **unable to view `.env` or `.env.local` files** because they are included in the `.gitignore` file for this project. When you are searching for environment variables or secrets (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`), please be aware that these files may appear to not exist, but they are simply not available to your scans. You will need to ask for the necessary environment variables if they are required for a task.

### Development Workflow

- To start the development server, run `npm run dev`.
- To run unit tests, use `npm test`.
- To run end-to-end tests, use `npm run e2e`.
- The main application entry point is `index.tsx`, which renders the `App.tsx` component.
- Core components are located in `src/components`.
- Services for interacting with APIs (like Supabase and AI services) are in `services/` and `src/services/`.