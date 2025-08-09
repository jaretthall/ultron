-- Simple fix for schedules table - only add missing columns without copying data
-- Run this in your Supabase SQL editor

-- Add the missing columns that the app expects
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS context TEXT DEFAULT '';

ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false;

ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'other';

ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';

ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS recurring JSONB;

ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS reminders JSONB;

ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS blocks_work_time BOOLEAN DEFAULT false;

ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add start_date and end_date columns if they don't exist
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;

ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_schedules_user_start_date ON public.schedules(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_schedules_tags ON public.schedules USING GIN(tags);

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'schedules' 
AND table_schema = 'public'
ORDER BY ordinal_position;