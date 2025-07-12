# Claude Code Assistant Memory

## Project: Ultron Productivity Command Center

### Important Development Practices

**ALWAYS RUN TYPE-CHECK AFTER MAKING CODE CHANGES:**
```bash
npm run type-check
```
This is critical for catching TypeScript errors before they cause runtime issues.

### Recent Issues Fixed
- Business export data filtering (all projects now properly marked as business context)
- AI services re-enabled (removed mock data fallbacks)
- Enhanced AI prompt template with optimization principles

### Key File Locations
- AI Services: `src/services/aiService.ts`
- AI Dashboard: `src/components/ai/AIDashboard.tsx`
- Type Definitions: `types.ts`

### Current Status
- Business export working correctly
- AI services enabled but need TypeScript fixes
- Enhanced prompt template with time estimation and prioritization