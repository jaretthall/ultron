# 🚀 Ultron - AI-Powered Productivity Command Center

[![Version](https://img.shields.io/badge/version-2.5.21-blue.svg)](./package.json)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fultron)

> **Phase 5**: User Experience Enhancement - Authentication fixes and diagnostics

## 🌟 Overview

Ultron is a comprehensive AI-powered productivity command center that combines project management, task tracking, calendar integration, and intelligent insights to help users optimize their workflow and achieve better work-life balance.

### ✨ Key Features

- 🎯 **Smart Task Management** - AI-assisted priority optimization and dependency tracking
- 📊 **Project Dashboard** - Real-time progress visualization and strategic insights  
- 🤖 **AI Integration** - Gemini, Claude, and OpenAI for intelligent recommendations
- 📅 **Calendar Integration** - Working hours management and focus block scheduling
- 📈 **Analytics Dashboard** - Performance tracking and productivity insights
- 🔍 **Global Search** - Intelligent search across all entities with keyboard shortcuts
- 📱 **Mobile Responsive** - Optimized for all screen sizes
- 🔒 **Secure Authentication** - Supabase Auth with Row Level Security

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account
- AI API keys (optional: Gemini, Claude, OpenAI)

### 1. Clone & Install

\`\`\`bash
git clone https://github.com/your-username/ultron.git
cd ultron
npm install
\`\`\`

### 2. Environment Setup

\`\`\`bash
# Copy environment template
cp .env.local.template .env.local

# Edit .env.local with your credentials:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key (optional)
\`\`\`

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema: `supabase_schema.sql`
3. Enable email authentication in Supabase Auth settings

### 4. Development

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:5173` to see your app!

## 🛠️ Deployment

### Vercel (Recommended)

1. **Push to GitHub** (you're here! 🎉)
2. **Connect to Vercel**: Import your GitHub repo
3. **Set Environment Variables**: Add your Supabase and AI keys
4. **Deploy**: Automatic deployments on every push

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fultron)

### Manual Deployment

\`\`\`bash
npm run build:prod
npm run preview
\`\`\`

## 🔧 Troubleshooting

### Authentication Issues

If you can't log in or create users:

1. **Open Diagnostics**: Visit `/debug-supabase.html`
2. **Check Project Status**: Ensure Supabase project isn't paused
3. **Verify Settings**: Email confirmation should be disabled for testing
4. **CORS Configuration**: Add your domain to Supabase allowed origins

### Common Solutions

- **Project Paused**: Unpause in Supabase dashboard
- **Email Verification**: Disable for testing in Auth settings  
- **RLS Policies**: Check if too restrictive
- **API Keys**: Verify in environment variables

## 📚 Documentation

- [Implementation Guide](./IMPLEMENTATION_GUIDE_v2.5.20.md)
- [Product Requirements](./prd.md)
- [Docker Deployment](./DOCKER_DEPLOYMENT.md)
- [Serverless Functions](./SERVERLESS_DEPLOYMENT.md)

## 🧪 Testing

\`\`\`bash
# Unit tests
npm test

# E2E tests  
npm run e2e

# Coverage
npm run test:coverage
\`\`\`

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI Services**: Gemini, Claude, OpenAI (serverless functions)
- **Deployment**: Vercel with automatic CI/CD
- **Testing**: Jest + Cypress

## 📈 Roadmap

- ✅ **Phase 1-4**: Core features, AI integration, analytics
- 🟡 **Phase 5**: UX enhancement (current)
- ⏳ **Phase 6**: Production readiness & security
- 🎯 **v3.0**: Public launch with collaboration features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**Version**: 2.5.21 | **Status**: Phase 5 - UX Enhancement | **Next**: Production Readiness
