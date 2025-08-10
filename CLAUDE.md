# Claude Code Assistant Memory

## Project: Ultron Productivity Command Center

### Important Development Practices

**ALWAYS RUN TYPE-CHECK AFTER MAKING CODE CHANGES:**
```bash
npm run type-check
```
This is critical for catching TypeScript errors before they cause runtime issues.

**ALWAYS RUN TEST SUITE BEFORE COMMITTING:**
```bash
npm run test:ci
```
This runs Jest tests with coverage and CI configuration.

**ALWAYS DESIGN FOR DESKTOP + MOBILE SIMULTANEOUSLY:**
All UI components and features must work seamlessly on both desktop and mobile devices from the start.

### Recent Issues Fixed
- Business export data filtering (all projects now properly marked as business context)
- AI services re-enabled (removed mock data fallbacks)
- Enhanced AI prompt template with optimization principles
- Fixed Jest configuration conflict (removed duplicate config from package.json, kept jest.config.js)
- Fixed TypeScript errors in aiService.ts with proper error handling
- Fixed schedule saving functionality with enhanced error handling and custom auth compatibility
- **Fixed Supabase RLS policies** - All tables now have proper row-level security policies for user data isolation
- **Fixed adaptive database service** - Tasks, user preferences, and tags now properly use Supabase instead of falling back to localStorage
- **Fixed Supabase client headers** - Added proper API key header for authentication
- **MAJOR: Migrated to pure Supabase authentication** - Removed custom auth system, migrated all user data, now using standard Supabase auth flows

### Key File Locations
- AI Services: `src/services/aiService.ts`
- AI Dashboard: `src/components/ai/AIDashboard.tsx`
- Type Definitions: `types.ts`
- Jest Config: `jest.config.js` (DO NOT add Jest config to package.json)

### Current Status
- ✅ Business export working correctly
- ✅ AI services fully enabled and TypeScript compliant
- ✅ Enhanced prompt template with time estimation and prioritization
- ✅ Jest configuration properly configured with single config file
- ✅ Schedule saving working with cross-device sync (daily_schedules table created)
- ✅ Calendar integration service layer completed (Step 2/4)

### Calendar Integration Progress
**Step 1**: ✅ Database schema extended with work session fields
**Step 2**: ✅ Service layer with AI scheduling, work session management, and data parsing
**Step 3**: Pending - Calendar UI views (month/week/day with mobile support)
**Step 4**: Pending - AI suggestion interface (approve/deny/modify)

### Completed Fixes
- Schedule saving functionality restored by creating daily_schedules table
- Cross-device synchronization confirmed working (desktop ↔ mobile)
- Enhanced error logging implemented for future debugging