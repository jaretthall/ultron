-- Temporary fix for schedules table - add missing columns that the app expects
-- Run this in your Supabase SQL editor

-- Add the missing columns to make the app work
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS context TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'other',
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS recurring JSONB,
ADD COLUMN IF NOT EXISTS reminders JSONB,
ADD COLUMN IF NOT EXISTS blocks_work_time BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add start_date and end_date columns (keep start_time/end_time for compatibility)
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Copy existing data
UPDATE public.schedules SET 
    start_date = start_time,
    end_date = end_time,
    context = COALESCE(description, ''),
    blocks_work_time = COALESCE(is_focus_block, false)
WHERE start_date IS NULL OR end_date IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_schedules_user_start_date ON public.schedules(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_schedules_tags ON public.schedules USING GIN(tags);