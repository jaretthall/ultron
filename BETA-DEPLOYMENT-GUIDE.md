# Beta Deployment Guide

## ✅ Completed Setup
- Beta branch created with environment support
- Beta Supabase project created
- Database schema script ready
- Environment variables configured

## 🚀 Next Steps

### 1. Set Up Beta Database
1. Go to your beta Supabase project: https://supabase.com/dashboard/project/qkkjarjnqrigvbqijgcs
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `beta-database-setup.sql`
4. Click **Run** to execute the schema setup

### 2. Push Beta Branch (Manual)
```bash
git push -u origin beta
```

### 3. Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import the repository (if not already connected)
3. Create a new deployment:
   - **Branch**: `beta`
   - **Root Directory**: Leave blank
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4. Configure Vercel Environment Variables
In your Vercel project settings, add these environment variables:

```
VITE_BETA_MODE=true
VITE_SUPABASE_URL_BETA=https://qkkjarjnqrigvbqijgcs.supabase.co
VITE_SUPABASE_ANON_KEY_BETA=sb_publishable_oLWGJjNukZCeNLPF2wTqDA_Tag-ctpW
```

Copy your AI API keys from production if you want AI features enabled:
```
API_KEY=your-gemini-key
CLAUDE_API_KEY=your-claude-key
OPENAI_API_KEY=your-openai-key
```

### 5. Test Beta Deployment
Once deployed, your beta URL will be something like:
`https://ultron-beta-xyz.vercel.app`

## 👥 Beta User Guide

### For Your Kids (Beta Testers)
1. **Sign up** at the beta URL with their own email/password
2. **Think of "Projects" as "Classes"**:
   - Create projects for each class (Math, English, etc.)
   - Set deadlines for major assignments/exams
3. **Think of "Tasks" as "Assignments"**:
   - Add homework, projects, study sessions
   - Set due dates and priorities
4. **Use the Calendar** to plan their schedule
5. **Try AI features** for study planning and time management

### Key Features to Test
- ✅ Account creation and login
- ✅ Creating projects (classes)
- ✅ Adding tasks (assignments)
- ✅ Calendar scheduling
- ✅ AI-powered planning
- ✅ Mobile responsiveness
- ✅ Data persistence across sessions

## 🔄 Updating Beta
When you make changes:
1. Commit to the `beta` branch
2. Push to trigger automatic Vercel deployment
3. Changes appear immediately at the beta URL

## 🎯 What You're Testing
- **Core functionality** across all features
- **User experience** for students vs business users
- **Mobile/desktop compatibility**
- **Performance** and loading times
- **Bug identification** and edge cases

Your kids will provide valuable feedback on the user experience from a student perspective!