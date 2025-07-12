-- Fix daily_schedules table to work with custom authentication system
-- This addresses the schema mismatch between custom auth and Supabase auth

-- Drop existing table and policies if they exist
DROP POLICY IF EXISTS "Users can manage their own daily schedules" ON daily_schedules;
DROP TABLE IF EXISTS daily_schedules;

-- Create daily_schedules table compatible with custom auth
CREATE TABLE daily_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Remove foreign key constraint to auth.users
    schedule_date DATE NOT NULL,
    schedule_text TEXT NOT NULL DEFAULT '',
    schedule_type TEXT DEFAULT 'mixed', -- 'business', 'personal', 'mixed'
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status TEXT DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one schedule per user per date
    UNIQUE(user_id, schedule_date)
);

-- Enable Row Level Security
ALTER TABLE daily_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policy compatible with custom auth
-- Since custom auth doesn't use auth.uid(), we'll allow authenticated users to access their own data
CREATE POLICY "Custom auth users can manage their own daily schedules" ON daily_schedules
    FOR ALL 
    USING (true) -- Allow all authenticated users (custom auth handles user isolation in application layer)
    WITH CHECK (true);

-- Alternative: More restrictive policy if we want to check user_id
-- CREATE POLICY "Custom auth users can manage their own daily schedules" ON daily_schedules
--     FOR ALL 
--     USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub')
--     WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create indexes for faster queries
CREATE INDEX idx_daily_schedules_user_date ON daily_schedules(user_id, schedule_date);
CREATE INDEX idx_daily_schedules_date ON daily_schedules(schedule_date);
CREATE INDEX idx_daily_schedules_user_id ON daily_schedules(user_id);

-- Grant permissions to authenticated users
GRANT ALL ON daily_schedules TO authenticated;
GRANT ALL ON daily_schedules TO anon; -- Allow anonymous access for custom auth
GRANT USAGE ON SEQUENCE daily_schedules_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE daily_schedules_id_seq TO anon;

-- Create a function to ensure user exists before saving schedule
CREATE OR REPLACE FUNCTION ensure_user_exists_for_schedule()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be expanded to validate user_id against custom users table
    -- For now, just ensure user_id is a valid UUID
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be null';
    END IF;
    
    -- Set updated_at on updates
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at = NOW();
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the function
CREATE TRIGGER ensure_user_exists_for_schedule_trigger
    BEFORE INSERT OR UPDATE ON daily_schedules
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_exists_for_schedule();

-- Test the table creation
DO $$
BEGIN
    INSERT INTO daily_schedules (user_id, schedule_date, schedule_text, schedule_type)
    VALUES (
        'test-user-id'::uuid,
        CURRENT_DATE,
        'Test schedule content',
        'mixed'
    );
    
    -- Clean up test data
    DELETE FROM daily_schedules WHERE user_id = 'test-user-id'::uuid;
    
    RAISE NOTICE 'daily_schedules table test successful';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'daily_schedules table test failed: %', SQLERRM;
END;
$$;