-- Create daily_schedules table compatible with custom auth
CREATE TABLE daily_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    schedule_date DATE NOT NULL,
    schedule_text TEXT NOT NULL DEFAULT '',
    schedule_type TEXT DEFAULT 'mixed',
    
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
CREATE POLICY "Custom auth users can manage their own daily schedules" ON daily_schedules
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX idx_daily_schedules_user_date ON daily_schedules(user_id, schedule_date);
CREATE INDEX idx_daily_schedules_date ON daily_schedules(schedule_date);
CREATE INDEX idx_daily_schedules_user_id ON daily_schedules(user_id);

-- Grant permissions to authenticated users
GRANT ALL ON daily_schedules TO authenticated;
GRANT ALL ON daily_schedules TO anon;
GRANT USAGE ON SEQUENCE daily_schedules_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE daily_schedules_id_seq TO anon;

-- Create a function to ensure user exists before saving schedule
CREATE OR REPLACE FUNCTION ensure_user_exists_for_schedule()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure user_id is not null
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