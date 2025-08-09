-- Create table for storing daily schedule text (manual schedules from homepage)
CREATE TABLE daily_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Create RLS policy for users to manage their own daily schedules
CREATE POLICY "Users can manage their own daily schedules" ON daily_schedules
    FOR ALL USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_daily_schedules_user_date ON daily_schedules(user_id, schedule_date);
CREATE INDEX idx_daily_schedules_date ON daily_schedules(schedule_date);

-- Grant permissions to authenticated users
GRANT ALL ON daily_schedules TO authenticated;
GRANT USAGE ON SEQUENCE daily_schedules_id_seq TO authenticated;