-- Update existing schedules table to add missing columns for calendar events
-- First, check if the missing columns exist and add them if they don't

-- Add context column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'context') THEN
        ALTER TABLE public.schedules ADD COLUMN context TEXT;
    END IF;
END $$;

-- Add event_type column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'event_type') THEN
        ALTER TABLE public.schedules ADD COLUMN event_type VARCHAR(50) DEFAULT 'other';
    END IF;
END $$;

-- Add location column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'location') THEN
        ALTER TABLE public.schedules ADD COLUMN location VARCHAR(255);
    END IF;
END $$;

-- Add blocks_work_time column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'blocks_work_time') THEN
        ALTER TABLE public.schedules ADD COLUMN blocks_work_time BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Modify project_id to allow NULL values (for standalone events)
ALTER TABLE public.schedules ALTER COLUMN project_id DROP NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_date ON public.schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_schedules_end_date ON public.schedules(end_date);
CREATE INDEX IF NOT EXISTS idx_schedules_project_id ON public.schedules(project_id);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own schedules" ON public.schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules" ON public.schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" ON public.schedules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" ON public.schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schedules_updated_at 
    BEFORE UPDATE ON public.schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 