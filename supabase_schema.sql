-- Supabase Database Schema for Duecex Application
-- Version: 2.4.0
-- This schema implements all tables from types.ts with proper RLS policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create ENUM types first
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
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority task_priority DEFAULT 'medium',
    estimated_hours DECIMAL(5,2) DEFAULT 1.0 CHECK (estimated_hours >= 0),
    status task_status DEFAULT 'todo',
    dependencies TEXT[] DEFAULT '{}', -- Array of task UUIDs
    due_date TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    task_context task_context DEFAULT 'inherited',
    energy_level energy_level DEFAULT 'medium',
    notes TEXT DEFAULT '',
    completion_notes TEXT DEFAULT '',
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '17:00',
    focus_block_duration INTEGER DEFAULT 90,
    break_duration INTEGER DEFAULT 15,
    priority_weight_deadline DECIMAL(3,2) DEFAULT 0.40 CHECK (priority_weight_deadline >= 0 AND priority_weight_deadline <= 1),
    priority_weight_effort DECIMAL(3,2) DEFAULT 0.30 CHECK (priority_weight_effort >= 0 AND priority_weight_effort <= 1),
    priority_weight_deps DECIMAL(3,2) DEFAULT 0.30 CHECK (priority_weight_deps >= 0 AND priority_weight_deps <= 1),
    instructions TEXT,
    business_hours_start TIME DEFAULT '09:00',
    business_hours_end TIME DEFAULT '17:00',
    business_days day_of_week[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri']::day_of_week[],
    personal_time_weekday_evening BOOLEAN DEFAULT true,
    personal_time_weekends BOOLEAN DEFAULT true,
    personal_time_early_morning BOOLEAN DEFAULT false,
    allow_business_in_personal_time BOOLEAN DEFAULT false,
    allow_personal_in_business_time BOOLEAN DEFAULT false,
    context_switch_buffer_minutes INTEGER DEFAULT 30,
    ai_provider ai_provider DEFAULT 'gemini',
    selected_gemini_model TEXT DEFAULT 'gemini-1.5-flash',
    claude_api_key TEXT,
    openai_api_key TEXT,
    focus_blocks TEXT[] DEFAULT '{}',
    preferred_time_slots TEXT[] DEFAULT '{}',
    business_relevance_default INTEGER DEFAULT 70 CHECK (business_relevance_default >= 0 AND business_relevance_default <= 100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tag Categories table
CREATE TABLE IF NOT EXISTS tag_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    color TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    description TEXT,
    category_id UUID REFERENCES tag_categories(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false,
    recurring JSONB, -- Recurrence rule as JSON
    reminders JSONB, -- Array of reminders as JSON
    tags TEXT[] DEFAULT '{}',
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type document_type DEFAULT 'text',
    content TEXT,
    file_path TEXT,
    mime_type TEXT,
    size BIGINT DEFAULT 0, -- Size in bytes
    tags TEXT[] DEFAULT '{}',
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Universal Sync Fields
    created_by TEXT,
    last_modified_by TEXT,
    version INTEGER DEFAULT 1,
    sync_status sync_status DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_context ON projects(context);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_categories_user_id ON tag_categories(user_id);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);

CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_project_id ON schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date_range ON schedules(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);

CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_date ON plans(date);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Projects RLS Policies
CREATE POLICY "Users can manage their own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);

-- Tasks RLS Policies
CREATE POLICY "Users can manage their own tasks" ON tasks
    FOR ALL USING (auth.uid() = user_id);

-- User Preferences RLS Policies
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Tags RLS Policies
CREATE POLICY "Users can manage their own tags" ON tags
    FOR ALL USING (auth.uid() = user_id);

-- Tag Categories RLS Policies
CREATE POLICY "Users can manage their own tag categories" ON tag_categories
    FOR ALL USING (auth.uid() = user_id);

-- Notes RLS Policies
CREATE POLICY "Users can manage their own notes" ON notes
    FOR ALL USING (auth.uid() = user_id);

-- Schedules RLS Policies
CREATE POLICY "Users can manage their own schedules" ON schedules
    FOR ALL USING (auth.uid() = user_id);

-- Documents RLS Policies
CREATE POLICY "Users can manage their own documents" ON documents
    FOR ALL USING (auth.uid() = user_id);

-- Plans RLS Policies
CREATE POLICY "Users can manage their own plans" ON plans
    FOR ALL USING (auth.uid() = user_id);

-- Functions and Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tag_categories_updated_at BEFORE UPDATE ON tag_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default tag categories for new users
CREATE OR REPLACE FUNCTION create_default_tag_categories()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tag_categories (user_id, name, label, color, description) VALUES
        (NEW.id, 'work', 'Work', '#3b82f6', 'Work-related items'),
        (NEW.id, 'personal', 'Personal', '#10b981', 'Personal tasks and projects'),
        (NEW.id, 'urgent', 'Urgent', '#ef4444', 'High priority items'),
        (NEW.id, 'learning', 'Learning', '#8b5cf6', 'Educational content'),
        (NEW.id, 'health', 'Health', '#f59e0b', 'Health and wellness');
    
    INSERT INTO user_preferences (user_id) VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default categories when a new user signs up
CREATE TRIGGER create_user_defaults_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_tag_categories();

-- Function to automatically update tag usage counts
CREATE OR REPLACE FUNCTION update_tag_usage_counts()
RETURNS TRIGGER AS $$
DECLARE
    tag_name TEXT;
BEGIN
    -- Handle different operations
    IF TG_OP = 'INSERT' THEN
        -- Increment usage count for tags in the new record
        FOREACH tag_name IN ARRAY NEW.tags
        LOOP
            UPDATE tags 
            SET usage_count = usage_count + 1 
            WHERE name = tag_name AND user_id = NEW.user_id;
        END LOOP;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Decrement old tags, increment new tags
        FOREACH tag_name IN ARRAY OLD.tags
        LOOP
            UPDATE tags 
            SET usage_count = GREATEST(usage_count - 1, 0)
            WHERE name = tag_name AND user_id = OLD.user_id;
        END LOOP;
        FOREACH tag_name IN ARRAY NEW.tags
        LOOP
            UPDATE tags 
            SET usage_count = usage_count + 1 
            WHERE name = tag_name AND user_id = NEW.user_id;
        END LOOP;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement usage count for tags in the deleted record
        FOREACH tag_name IN ARRAY OLD.tags
        LOOP
            UPDATE tags 
            SET usage_count = GREATEST(usage_count - 1, 0)
            WHERE name = tag_name AND user_id = OLD.user_id;
        END LOOP;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply tag usage update triggers
CREATE TRIGGER update_project_tag_usage
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_counts();

CREATE TRIGGER update_task_tag_usage
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_counts();

CREATE TRIGGER update_note_tag_usage
    AFTER INSERT OR UPDATE OR DELETE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_counts();

CREATE TRIGGER update_schedule_tag_usage
    AFTER INSERT OR UPDATE OR DELETE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_counts();

CREATE TRIGGER update_document_tag_usage
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_counts(); 