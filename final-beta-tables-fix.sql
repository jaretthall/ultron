-- Final Fix for Remaining Beta Database Issues

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create missing ENUM types if they don't exist
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
    CREATE TYPE sync_status AS ENUM ('new', 'modified', 'synced', 'conflict');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create missing users table (your app expects this)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create missing notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopping lists tables
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    completed BOOLEAN DEFAULT false,
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    completed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix user_preferences table schema (drop and recreate)
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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for beta testing
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on shopping_lists" ON shopping_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on shopping_list_items" ON shopping_list_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_preferences" ON user_preferences FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON users TO authenticated, anon;
GRANT ALL ON notes TO authenticated, anon;
GRANT ALL ON shopping_lists TO authenticated, anon;
GRANT ALL ON shopping_list_items TO authenticated, anon;
GRANT ALL ON user_preferences TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT '✅ All missing tables created and schema fixed!' as message;