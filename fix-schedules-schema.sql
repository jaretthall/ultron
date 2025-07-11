-- Fix schedules table schema to match application expectations
-- This migration adds missing columns to the schedules table

-- Add missing columns one by one with proper defaults
DO $$ 
BEGIN
    -- Add context column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='context') THEN
        ALTER TABLE public.schedules ADD COLUMN context TEXT DEFAULT '';
    END IF;

    -- Add all_day column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='all_day') THEN
        ALTER TABLE public.schedules ADD COLUMN all_day BOOLEAN DEFAULT false;
    END IF;

    -- Add event_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='event_type') THEN
        ALTER TABLE public.schedules ADD COLUMN event_type TEXT DEFAULT 'other';
    END IF;

    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='location') THEN
        ALTER TABLE public.schedules ADD COLUMN location TEXT DEFAULT '';
    END IF;

    -- Add recurring column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='recurring') THEN
        ALTER TABLE public.schedules ADD COLUMN recurring JSONB;
    END IF;

    -- Add reminders column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='reminders') THEN
        ALTER TABLE public.schedules ADD COLUMN reminders JSONB;
    END IF;

    -- Add blocks_work_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='blocks_work_time') THEN
        ALTER TABLE public.schedules ADD COLUMN blocks_work_time BOOLEAN DEFAULT false;
    END IF;

    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='tags') THEN
        ALTER TABLE public.schedules ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;

    -- Add start_date/end_date columns if they don't exist (keeping start_time/end_time for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='start_date') THEN
        ALTER TABLE public.schedules ADD COLUMN start_date TIMESTAMPTZ;
        -- Copy values from start_time to start_date
        UPDATE public.schedules SET start_date = start_time WHERE start_time IS NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='end_date') THEN
        ALTER TABLE public.schedules ADD COLUMN end_date TIMESTAMPTZ;
        -- Copy values from end_time to end_date
        UPDATE public.schedules SET end_date = end_time WHERE end_time IS NOT NULL;
    END IF;

    -- Add universal sync fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='created_by') THEN
        ALTER TABLE public.schedules ADD COLUMN created_by TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='last_modified_by') THEN
        ALTER TABLE public.schedules ADD COLUMN last_modified_by TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='version') THEN
        ALTER TABLE public.schedules ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='sync_status') THEN
        -- First create the enum type if it doesn't exist
        DO $enum$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
                CREATE TYPE sync_status AS ENUM ('new', 'modified', 'synced', 'conflict');
            END IF;
        END $enum$;
        
        ALTER TABLE public.schedules ADD COLUMN sync_status sync_status DEFAULT 'new';
    END IF;

    -- Add project_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='project_id') THEN
        ALTER TABLE public.schedules ADD COLUMN project_id UUID;
        -- Add foreign key constraint if projects table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='projects') THEN
            ALTER TABLE public.schedules ADD CONSTRAINT schedules_project_id_fkey 
                FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
        END IF;
    END IF;

END $$;

-- Update existing data to have sensible defaults
UPDATE public.schedules SET 
    context = COALESCE(context, description, ''),
    all_day = COALESCE(all_day, false),
    event_type = COALESCE(event_type, 'other'),
    location = COALESCE(location, ''),
    blocks_work_time = COALESCE(blocks_work_time, is_focus_block, false),
    tags = COALESCE(tags, '{}'),
    start_date = COALESCE(start_date, start_time),
    end_date = COALESCE(end_date, end_time),
    version = COALESCE(version, 1),
    sync_status = COALESCE(sync_status, 'synced'::sync_status)
WHERE TRUE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_date ON public.schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_schedules_tags ON public.schedules USING GIN(tags);

-- Enable RLS if not already enabled
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user access
DROP POLICY IF EXISTS "Users can access their own schedules" ON public.schedules;
CREATE POLICY "Users can access their own schedules" ON public.schedules
    FOR ALL USING (user_id = auth.uid());

COMMENT ON TABLE public.schedules IS 'Calendar events and appointments with full sync support';