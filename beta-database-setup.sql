-- Beta Database Setup for Ultron
-- This script sets up the complete database schema for beta testing
-- Run this in your beta Supabase project SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create ENUM types
CREATE TYPE project_status AS ENUM ('active', 'completed', 'on-hold');
CREATE TYPE project_context AS ENUM ('business', 'personal', 'hybrid');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('todo', 'in-progress', 'completed');
CREATE TYPE ai_provider AS ENUM ('gemini', 'claude', 'openai');
CREATE TYPE sync_status AS ENUM ('new', 'modified', 'synced', 'conflict');
CREATE TYPE energy_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_context AS ENUM ('personal', 'business', 'inherited');
CREATE TYPE document_type AS ENUM ('image', 'pdf', 'text', 'other');
CREATE TYPE day_of_week AS ENUM ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    goals TEXT[] DEFAULT '{}',
    deadline TIMESTAMPTZ,
    status project_status DEFAULT 'active',
    context project_context DEFAULT 'personal',
    tags TEXT[] DEFAULT '{}',
    business_relevance INTEGER DEFAULT 50 CHECK (business_relevance >= 0 AND business_relevance <= 100),
    preferred_time_slots TEXT[] DEFAULT '{}',
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'todo',
    context task_context DEFAULT 'personal',
    business_relevance INTEGER DEFAULT 50 CHECK (business_relevance >= 0 AND business_relevance <= 100),
    
    -- Time and scheduling
    due_date TIMESTAMPTZ,
    estimated_hours DECIMAL(4,2),
    preferred_time_slots TEXT[] DEFAULT '{}',
    energy_level energy_level DEFAULT 'medium',
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences table
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

-- Daily Schedules table (recent addition)
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

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedules ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for beta testing
-- These allow any authenticated user to access any data (good for testing)
CREATE POLICY "Beta testing - allow all operations on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Beta testing - allow all operations on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Beta testing - allow all operations on user_preferences" ON user_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Beta testing - allow all operations on daily_schedules" ON daily_schedules FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_daily_schedules_user_date ON daily_schedules(user_id, schedule_date);
CREATE INDEX idx_daily_schedules_date ON daily_schedules(schedule_date);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_schedules_updated_at BEFORE UPDATE ON daily_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Beta database setup completed successfully! 🎉' as message;