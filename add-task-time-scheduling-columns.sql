-- Add time scheduling columns to tasks table
-- This migration adds the required columns for task time scheduling functionality

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_time_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;

-- Add indexes for better performance on time-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_start ON tasks(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_end ON tasks(scheduled_end);
CREATE INDEX IF NOT EXISTS idx_tasks_is_time_blocked ON tasks(is_time_blocked);

-- Add check constraint to ensure scheduled_end is after scheduled_start
ALTER TABLE tasks 
ADD CONSTRAINT chk_scheduled_times 
CHECK (
  (scheduled_start IS NULL AND scheduled_end IS NULL) OR 
  (scheduled_start IS NOT NULL AND scheduled_end IS NOT NULL AND scheduled_end > scheduled_start)
);

-- Update RLS policies to include the new columns in SELECT policies
-- (existing INSERT/UPDATE policies should already handle these via the wildcard permissions)

COMMENT ON COLUMN tasks.is_time_blocked IS 'Whether this task blocks time on the calendar';
COMMENT ON COLUMN tasks.scheduled_start IS 'Start time for time-blocked tasks';
COMMENT ON COLUMN tasks.scheduled_end IS 'End time for time-blocked tasks';