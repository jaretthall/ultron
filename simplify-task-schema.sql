-- Simplify task system by removing flow-based complexity
-- Remove template, challenge level, engagement strategy, and flow block features
-- Keep only essential task scheduling (due_date with time)

-- Drop unnecessary columns from tasks table
ALTER TABLE public.tasks 
DROP COLUMN IF EXISTS work_session_scheduled_start,
DROP COLUMN IF EXISTS work_session_scheduled_end,
DROP COLUMN IF EXISTS ai_suggested;

-- The Task table now has clean, simple scheduling:
-- - due_date: when the task is due (with optional time)
-- - scheduled_start: when user wants to work on it (optional)
-- - scheduled_end: end of work session (optional)
-- - is_time_blocked: whether this blocks calendar time

-- Verify the simplified table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'tasks'
ORDER BY ordinal_position;
