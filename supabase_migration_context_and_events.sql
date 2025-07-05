-- Supabase Migration Script: Context Fields & Calendar Events
-- Version: 2.5.39
-- Description: Updates database schema to support context fields and enhanced calendar events

-- =============================================================================
-- 1. CREATE NEW ENUM TYPES
-- =============================================================================

-- Create event_type enum for calendar events
CREATE TYPE event_type AS ENUM ('meeting', 'appointment', 'deadline', 'personal', 'other');

-- =============================================================================
-- 2. UPDATE PROJECTS TABLE
-- =============================================================================

-- Step 1: Add new context column (for AI context/description)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS context_new TEXT DEFAULT '';

-- Step 2: Copy data from description to new context column
UPDATE projects 
SET context_new = COALESCE(description, '');

-- Step 3: Rename existing context column to project_context (business/personal/hybrid)
ALTER TABLE projects 
RENAME COLUMN context TO project_context;

-- Step 4: Rename new context column to context
ALTER TABLE projects 
RENAME COLUMN context_new TO context;

-- Step 5: Drop old description column
ALTER TABLE projects 
DROP COLUMN IF EXISTS description;

-- Step 6: Update index names to reflect the new column structure
DROP INDEX IF EXISTS idx_projects_context;
CREATE INDEX IF NOT EXISTS idx_projects_project_context ON projects(project_context);

-- =============================================================================
-- 3. UPDATE TASKS TABLE  
-- =============================================================================

-- Step 1: Add new context column
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS context_new TEXT DEFAULT '';

-- Step 2: Copy data from description to new context column
UPDATE tasks 
SET context_new = COALESCE(description, '');

-- Step 3: Rename new context column to context
ALTER TABLE tasks 
RENAME COLUMN context_new TO context;

-- Step 4: Drop old description column
ALTER TABLE tasks 
DROP COLUMN IF EXISTS description;

-- =============================================================================
-- 4. UPDATE SCHEDULES TABLE FOR CALENDAR EVENTS
-- =============================================================================

-- Step 1: Make project_id nullable (for standalone events)
ALTER TABLE schedules 
ALTER COLUMN project_id DROP NOT NULL;

-- Step 2: Update foreign key constraint to SET NULL instead of CASCADE
ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS schedules_project_id_fkey;

ALTER TABLE schedules 
ADD CONSTRAINT schedules_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Step 3: Add new columns for enhanced calendar events
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS context TEXT,
ADD COLUMN IF NOT EXISTS event_type event_type DEFAULT 'other',
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS blocks_work_time BOOLEAN DEFAULT true;

-- Step 4: Add indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_schedules_event_type ON schedules(event_type);
CREATE INDEX IF NOT EXISTS idx_schedules_blocks_work_time ON schedules(blocks_work_time);

-- =============================================================================
-- 5. ADD MISSING TASK PROGRESS COLUMN (if not exists)
-- =============================================================================

-- Add progress column to tasks if it doesn't exist (mentioned in types but might be missing)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- =============================================================================
-- 6. UPDATE COMMENTS FOR CLARITY
-- =============================================================================

-- Add comments to clarify the new column purposes
COMMENT ON COLUMN projects.context IS 'AI context - detailed description for AI understanding of project purpose and requirements';
COMMENT ON COLUMN projects.project_context IS 'Project classification - business, personal, or hybrid context';

COMMENT ON COLUMN tasks.context IS 'AI context - detailed description for AI understanding of task purpose and requirements';

COMMENT ON COLUMN schedules.context IS 'Event description and notes for AI understanding';
COMMENT ON COLUMN schedules.event_type IS 'Type of calendar event - meeting, appointment, deadline, personal, or other';
COMMENT ON COLUMN schedules.location IS 'Location where the event takes place';
COMMENT ON COLUMN schedules.blocks_work_time IS 'Whether this event blocks time for AI task scheduling';

-- =============================================================================
-- 7. UPDATE ANY EXISTING DATA DEFAULTS
-- =============================================================================

-- Set default values for existing records
UPDATE projects 
SET context = COALESCE(context, '') 
WHERE context IS NULL;

UPDATE tasks 
SET context = COALESCE(context, '') 
WHERE context IS NULL;

UPDATE schedules 
SET blocks_work_time = true 
WHERE blocks_work_time IS NULL;

UPDATE schedules 
SET event_type = 'other' 
WHERE event_type IS NULL;

-- =============================================================================
-- 8. VERIFICATION QUERIES (OPTIONAL - FOR TESTING)
-- =============================================================================

-- Uncomment these to verify the migration worked correctly:

-- -- Verify projects table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'projects' 
-- ORDER BY ordinal_position;

-- -- Verify tasks table structure  
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'tasks' 
-- ORDER BY ordinal_position;

-- -- Verify schedules table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'schedules' 
-- ORDER BY ordinal_position;

-- -- Check enum types
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'event_type'::regtype;

-- =============================================================================
-- 9. GRANT PERMISSIONS (if needed)
-- =============================================================================

-- Ensure RLS policies still work with new columns
-- The existing RLS policies should continue to work since they use user_id

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- This migration script:
-- ✅ Changes 'description' to 'context' in projects and tasks tables
-- ✅ Handles the project context column naming properly  
-- ✅ Enhances schedules table for calendar events functionality
-- ✅ Preserves all existing data during the migration
-- ✅ Maintains proper indexes and constraints
-- ✅ Adds helpful column comments for future reference

SELECT 'Migration completed successfully! Context fields updated and calendar events functionality added.' AS status; 