-- Supabase ROLLBACK Script: Context Fields & Calendar Events
-- Version: 2.5.39
-- Description: Rollback script to undo the context fields and calendar events migration
-- ⚠️  WARNING: This will revert changes and may cause data loss!

-- =============================================================================
-- ROLLBACK INSTRUCTIONS
-- =============================================================================
-- Only run this if you need to rollback the migration due to issues.
-- This script will:
-- 1. Revert context columns back to description
-- 2. Remove calendar event enhancements 
-- 3. Restore original table structure

-- =============================================================================
-- 1. ROLLBACK PROJECTS TABLE
-- =============================================================================

-- Add back description column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Copy data from context back to description
UPDATE projects 
SET description = COALESCE(context, '');

-- Rename project_context back to context
ALTER TABLE projects 
RENAME COLUMN project_context TO context;

-- Drop the new context column
ALTER TABLE projects 
DROP COLUMN IF EXISTS context;

-- Restore original index
DROP INDEX IF EXISTS idx_projects_project_context;
CREATE INDEX IF NOT EXISTS idx_projects_context ON projects(context);

-- =============================================================================
-- 2. ROLLBACK TASKS TABLE
-- =============================================================================

-- Add back description column
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Copy data from context back to description  
UPDATE tasks 
SET description = COALESCE(context, '');

-- Drop the new context column
ALTER TABLE tasks 
DROP COLUMN IF EXISTS context;

-- =============================================================================
-- 3. ROLLBACK SCHEDULES TABLE
-- =============================================================================

-- Remove new calendar event columns
ALTER TABLE schedules 
DROP COLUMN IF EXISTS context,
DROP COLUMN IF EXISTS event_type,
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS blocks_work_time;

-- Restore project_id to NOT NULL
ALTER TABLE schedules 
ALTER COLUMN project_id SET NOT NULL;

-- Restore original foreign key constraint
ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS schedules_project_id_fkey;

ALTER TABLE schedules 
ADD CONSTRAINT schedules_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Remove indexes for calendar event columns
DROP INDEX IF EXISTS idx_schedules_event_type;
DROP INDEX IF EXISTS idx_schedules_blocks_work_time;

-- =============================================================================
-- 4. REMOVE NEW ENUM TYPE
-- =============================================================================

-- Drop the event_type enum (only if no other tables use it)
DROP TYPE IF EXISTS event_type;

-- =============================================================================
-- 5. REMOVE PROGRESS COLUMN (if you don't want it)
-- =============================================================================

-- Uncomment if you want to remove the progress column added during migration
-- ALTER TABLE tasks DROP COLUMN IF EXISTS progress;

-- =============================================================================
-- ROLLBACK COMPLETE
-- =============================================================================

SELECT 'Rollback completed! Tables reverted to original description-based structure.' AS status; 