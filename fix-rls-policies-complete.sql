-- Fix RLS Policies for All Tables
-- This script ensures proper Row Level Security for user data isolation

-- ===================================
-- 1. ENABLE RLS ON ALL TABLES
-- ===================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 2. DROP EXISTING POLICIES (Clean slate)
-- ===================================

-- User Preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

-- Projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Notes
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

-- Schedules
DROP POLICY IF EXISTS "Users can view own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON schedules;

-- Documents
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Plans
DROP POLICY IF EXISTS "Users can view own plans" ON plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON plans;
DROP POLICY IF EXISTS "Users can update own plans" ON plans;
DROP POLICY IF EXISTS "Users can delete own plans" ON plans;

-- Daily Schedules
DROP POLICY IF EXISTS "Users can view own daily schedules" ON daily_schedules;
DROP POLICY IF EXISTS "Users can insert own daily schedules" ON daily_schedules;
DROP POLICY IF EXISTS "Users can update own daily schedules" ON daily_schedules;
DROP POLICY IF EXISTS "Users can delete own daily schedules" ON daily_schedules;

-- Tags
DROP POLICY IF EXISTS "Users can view own tags" ON tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
DROP POLICY IF EXISTS "Users can update own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON tags;

-- Tag Categories
DROP POLICY IF EXISTS "Users can view own tag categories" ON tag_categories;
DROP POLICY IF EXISTS "Users can insert own tag categories" ON tag_categories;
DROP POLICY IF EXISTS "Users can update own tag categories" ON tag_categories;
DROP POLICY IF EXISTS "Users can delete own tag categories" ON tag_categories;

-- ===================================
-- 3. CREATE NEW RLS POLICIES
-- ===================================

-- USER PREFERENCES POLICIES
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
ON user_preferences FOR DELETE
USING (auth.uid() = user_id);

-- PROJECTS POLICIES
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- TASKS POLICIES
CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
ON tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
ON tasks FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
ON tasks FOR DELETE
USING (auth.uid() = user_id);

-- NOTES POLICIES
CREATE POLICY "Users can view own notes"
ON notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
ON notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
ON notes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
ON notes FOR DELETE
USING (auth.uid() = user_id);

-- SCHEDULES POLICIES
CREATE POLICY "Users can view own schedules"
ON schedules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
ON schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
ON schedules FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
ON schedules FOR DELETE
USING (auth.uid() = user_id);

-- DOCUMENTS POLICIES
CREATE POLICY "Users can view own documents"
ON documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
ON documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE
USING (auth.uid() = user_id);

-- PLANS POLICIES
CREATE POLICY "Users can view own plans"
ON plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
ON plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
ON plans FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
ON plans FOR DELETE
USING (auth.uid() = user_id);

-- DAILY SCHEDULES POLICIES
CREATE POLICY "Users can view own daily schedules"
ON daily_schedules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily schedules"
ON daily_schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily schedules"
ON daily_schedules FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily schedules"
ON daily_schedules FOR DELETE
USING (auth.uid() = user_id);

-- TAGS POLICIES (Tags might be shared or user-specific)
-- Assuming user-specific tags for now
CREATE POLICY "Users can view own tags"
ON tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
ON tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
ON tags FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
ON tags FOR DELETE
USING (auth.uid() = user_id);

-- TAG CATEGORIES POLICIES
CREATE POLICY "Users can view own tag categories"
ON tag_categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tag categories"
ON tag_categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tag categories"
ON tag_categories FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tag categories"
ON tag_categories FOR DELETE
USING (auth.uid() = user_id);

-- ===================================
-- 4. GRANT NECESSARY PERMISSIONS
-- ===================================

-- Grant permissions to authenticated users
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON notes TO authenticated;
GRANT ALL ON schedules TO authenticated;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON plans TO authenticated;
GRANT ALL ON daily_schedules TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON tag_categories TO authenticated;

-- ===================================
-- 5. VERIFY COLUMN EXISTENCE
-- ===================================

-- Add user_id column to tables that might be missing it
DO $$
BEGIN
    -- Check and add user_id to tags if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tags' AND column_name = 'user_id') THEN
        ALTER TABLE tags ADD COLUMN user_id UUID REFERENCES auth.users(id);
        UPDATE tags SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
        ALTER TABLE tags ALTER COLUMN user_id SET NOT NULL;
    END IF;

    -- Check and add user_id to tag_categories if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tag_categories' AND column_name = 'user_id') THEN
        ALTER TABLE tag_categories ADD COLUMN user_id UUID REFERENCES auth.users(id);
        UPDATE tag_categories SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
        ALTER TABLE tag_categories ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- ===================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ===================================

-- Create indexes on user_id columns for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_schedules_user_id ON daily_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_schedules_composite ON daily_schedules(user_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_categories_user_id ON tag_categories(user_id);

-- ===================================
-- 7. VERIFICATION QUERIES
-- ===================================

-- Run these queries to verify the policies are working:
-- SELECT * FROM user_preferences WHERE auth.uid() = user_id;
-- SELECT * FROM projects WHERE auth.uid() = user_id;
-- SELECT * FROM tasks WHERE auth.uid() = user_id;

-- To check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- To see all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies WHERE schemaname = 'public';