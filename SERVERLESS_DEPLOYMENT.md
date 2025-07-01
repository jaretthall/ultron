# Ultron Serverless Deployment Guide

## Overview

Ultron now uses serverless functions to handle AI API calls, resolving CORS issues and improving security by keeping API keys server-side.

## Serverless Functions Created

### API Endpoints

1. **`/api/claude-insights`** - Claude AI strategic insights
2. **`/api/gemini-insights`** - Gemini AI strategic insights  
3. **`/api/openai-insights`** - OpenAI strategic insights
4. **`/api/ai-daily-plan`** - Unified daily plan generation
5. **`/api/ai-unified`** - Unified AI service with provider fallback

## Environment Variables

Set these environment variables in your Vercel project:

```bash
# AI Service API Keys
CLAUDE_API_KEY=your_claude_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Deployment Steps

### Option 1: Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from project root:
   ```bash
   vercel
   ```

4. Set environment variables:
   ```bash
   vercel env add CLAUDE_API_KEY
   vercel env add GEMINI_API_KEY
   vercel env add OPENAI_API_KEY
   # ... add all required variables
   ```

### Option 2: Vercel Dashboard

1. Import your GitHub repository into Vercel
2. Configure environment variables in Project Settings
3. Deploy automatically on push to main branch

## Local Development

1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your API keys in `.env.local`

3. Start development server:
   ```bash
   npm run dev
   ```

4. Test serverless functions locally (optional):
   ```bash
   npm run vercel-dev
   ```

## Architecture Benefits

✅ **No More CORS Issues** - API calls are server-side  
✅ **Secure API Keys** - Keys stored server-side only  
✅ **Provider Fallback** - Automatic failover between AI providers  
✅ **Unified Interface** - Single endpoint for all AI operations  
✅ **Better Performance** - Edge function deployment  

## Testing the Deployment

After deployment, test these endpoints:

- `https://your-app.vercel.app/api/claude-insights` (POST)
- `https://your-app.vercel.app/api/ai-unified` (POST)

## Troubleshooting

1. **Function Timeout**: Increase timeout in `vercel.json`
2. **API Key Issues**: Check environment variables in Vercel dashboard
3. **CORS Errors**: Ensure you're calling the serverless endpoints, not direct APIs

## Version

Current version: **2.7.1** - Serverless AI Functions Implementation 