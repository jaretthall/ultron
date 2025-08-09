-- Fix Missing Tables in Beta Database
-- Run this in your beta Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create missing ENUM types
DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('new', 'modified', 'synced', 'conflict');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_provider AS ENUM ('gemini', 'claude', 'openai');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE day_of_week AS ENUM ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE energy_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create missing tables

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    usage_count INTEGER DEFAULT 0,
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Tag Categories table
CREATE TABLE IF NOT EXISTS tag_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#6B7280',
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix user_preferences table (drop and recreate to fix schema issues)
DROP TABLE IF EXISTS user_preferences CASCADE;

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    
    -- UI Preferences
    theme TEXT DEFAULT 'system',
    dashboard_layout TEXT DEFAULT 'default',
    default_view TEXT DEFAULT 'calendar',
    
    -- AI Preferences
    ai_provider ai_provider DEFAULT 'gemini',
    ai_model TEXT DEFAULT 'gemini-pro',
    ai_enabled BOOLEAN DEFAULT true,
    
    -- Scheduling Preferences
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '17:00:00',
    work_days day_of_week[] DEFAULT '{mon,tue,wed,thu,fri}',
    break_duration INTEGER DEFAULT 15,
    task_duration_default INTEGER DEFAULT 60,
    energy_schedule TEXT DEFAULT '{}',
    
    -- Universal sync fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for beta testing
CREATE POLICY "Allow all operations on tags" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tag_categories" ON tag_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on schedules" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_preferences" ON user_preferences FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON tags TO authenticated, anon;
GRANT ALL ON tag_categories TO authenticated, anon;
GRANT ALL ON schedules TO authenticated, anon;
GRANT ALL ON user_preferences TO authenticated, anon;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tag_categories_user_id ON tag_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_date ON schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tag_categories_updated_at BEFORE UPDATE ON tag_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT '✅ Missing tables created successfully!' as message;