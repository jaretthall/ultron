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

### Recent Issues Fixed
- Business export data filtering (all projects now properly marked as business context)
- AI services re-enabled (removed mock data fallbacks)
- Enhanced AI prompt template with optimization principles
- Fixed Jest configuration conflict (removed duplicate config from package.json, kept jest.config.js)
- Fixed TypeScript errors in aiService.ts with proper error handling

### Key File Locations
- AI Services: `src/services/aiService.ts`
- AI Dashboard: `src/components/ai/AIDashboard.tsx`
- Type Definitions: `types.ts`
- Jest Config: `jest.config.js` (DO NOT add Jest config to package.json)

### Current Status
- Business export working correctly
- AI services fully enabled and TypeScript compliant
- Enhanced prompt template with time estimation and prioritization
- Jest configuration properly configured with single config file