-- Add Only the Missing Tables to Beta Database
-- You already have: daily_schedules, projects, tasks, user_preferences

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create missing ENUM types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('new', 'modified', 'synced', 'conflict');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ONLY the missing tables

-- Tags table (404 error - missing)
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

-- Tag Categories table (404 error - missing)
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

-- Schedules table (404 error - missing)
-- Note: This is different from daily_schedules
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

-- Enable RLS on new tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;  
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for beta testing
CREATE POLICY "Allow all operations on tags" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tag_categories" ON tag_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on schedules" ON schedules FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON tags TO authenticated, anon;
GRANT ALL ON tag_categories TO authenticated, anon;
GRANT ALL ON schedules TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tag_categories_user_id ON tag_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_date ON schedules(start_date);

-- Success message
SELECT '✅ Missing tables (tags, tag_categories, schedules) created!' as message;