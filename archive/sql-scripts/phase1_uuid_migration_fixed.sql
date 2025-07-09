-- Phase 1 UUID Migration Script (FIXED)
-- Ultron Productivity Command Center v3.0.7+
-- 
-- This script addresses UUID and ID type inconsistencies identified in Phase 1 audit
-- FIXED VERSION: Handles all foreign key columns including task_id in schedules
--
-- IMPORTANT: Run this script in your Supabase SQL editor
-- BACKUP YOUR DATABASE BEFORE RUNNING THIS MIGRATION

-- Start transaction for atomic migration
BEGIN;

-- ========================================
-- STEP 1: Comprehensive Foreign Key Discovery
-- ========================================

-- First, let's see ALL foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- STEP 2: Create Custom Users Table
-- ========================================

-- Create a custom users table for the dual auth system
CREATE TABLE IF NOT EXISTS custom_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    auth_type TEXT DEFAULT 'custom',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on custom_users
ALTER TABLE custom_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for custom users
DROP POLICY IF EXISTS "Users can manage their own custom user data" ON custom_users;
CREATE POLICY "Users can manage their own custom user data" ON custom_users
    FOR ALL USING (id = current_setting('app.current_user_id', true));

-- ========================================
-- STEP 3: Drop ALL Foreign Key Constraints
-- ========================================

DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- Get all foreign key constraints in public schema
    FOR constraint_record IN 
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        RAISE NOTICE 'Dropped constraint % from table %', 
                     constraint_record.constraint_name, 
                     constraint_record.table_name;
    END LOOP;
END $$;

-- ========================================
-- STEP 4: Update ALL ID Columns to TEXT
-- ========================================

-- Projects table
ALTER TABLE projects 
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN user_id TYPE TEXT;

-- Tasks table  
ALTER TABLE tasks 
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN user_id TYPE TEXT,
  ALTER COLUMN project_id TYPE TEXT;

-- User preferences table
ALTER TABLE user_preferences 
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN user_id TYPE TEXT;

-- Tags table
ALTER TABLE tags 
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN user_id TYPE TEXT,
  ALTER COLUMN category_id TYPE TEXT;

-- Tag categories table
ALTER TABLE tag_categories 
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN user_id TYPE TEXT;

-- Notes table
ALTER TABLE notes 
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN user_id TYPE TEXT,
  ALTER COLUMN project_id TYPE TEXT;

-- Schedules table (COMPLETE - including any task_id if it exists)
DO $$
BEGIN
    -- Check if task_id column exists and update it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'schedules' AND column_name = 'task_id') THEN
        ALTER TABLE schedules ALTER COLUMN task_id TYPE TEXT;
        RAISE NOTICE 'Updated schedules.task_id to TEXT';
    END IF;
END $$;

ALTER TABLE schedules 
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN user_id TYPE TEXT,
  ALTER COLUMN project_id TYPE TEXT;

-- Documents table
ALTER TABLE documents 
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN user_id TYPE TEXT,
  ALTER COLUMN project_id TYPE TEXT;

-- Plans table
ALTER TABLE plans 
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN user_id TYPE TEXT;

-- Update any other _id columns we might have missed
DO $$
DECLARE
    col_record RECORD;
BEGIN
    FOR col_record IN 
        SELECT table_name, column_name
        FROM information_schema.columns 
        WHERE table_schema = 'public'
            AND (column_name LIKE '%_id' OR column_name = 'id')
            AND data_type = 'uuid'
            AND table_name NOT LIKE 'auth.%'
    LOOP
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE TEXT', 
                      col_record.table_name, 
                      col_record.column_name);
        RAISE NOTICE 'Updated %.% to TEXT', 
                     col_record.table_name, 
                     col_record.column_name;
    END LOOP;
END $$;

-- ========================================
-- STEP 5: Add ID Format Validation Constraints
-- ========================================

-- Add check constraints to ensure proper UUID format for main tables
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY['projects', 'tasks', 'user_preferences', 'tags', 'tag_categories', 'notes', 'schedules', 'documents', 'plans', 'custom_users'];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_id_format_check CHECK (id ~ ''^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'')', 
                      table_name, table_name);
        RAISE NOTICE 'Added ID format constraint to %', table_name;
    END LOOP;
END $$;

-- ========================================
-- STEP 6: Recreate Foreign Key Constraints
-- ========================================

-- Projects foreign keys
ALTER TABLE projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tasks foreign keys
ALTER TABLE tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- User preferences foreign keys
ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tags foreign keys
ALTER TABLE tags 
ADD CONSTRAINT tags_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE tags 
ADD CONSTRAINT tags_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE SET NULL;

-- Tag categories foreign keys
ALTER TABLE tag_categories 
ADD CONSTRAINT tag_categories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Notes foreign keys
ALTER TABLE notes 
ADD CONSTRAINT notes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE notes 
ADD CONSTRAINT notes_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Schedules foreign keys
ALTER TABLE schedules 
ADD CONSTRAINT schedules_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE schedules 
ADD CONSTRAINT schedules_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Add task_id foreign key if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'schedules' AND column_name = 'task_id') THEN
        ALTER TABLE schedules 
        ADD CONSTRAINT schedules_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added schedules_task_id_fkey constraint';
    END IF;
END $$;

-- Documents foreign keys
ALTER TABLE documents 
ADD CONSTRAINT documents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE documents 
ADD CONSTRAINT documents_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Plans foreign keys
ALTER TABLE plans 
ADD CONSTRAINT plans_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- ========================================
-- STEP 7: Update RLS Policies for Custom Auth
-- ========================================

-- Function to set current user context for custom auth
CREATE OR REPLACE FUNCTION set_current_user_id(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated RLS policies that check custom user context
-- Projects
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
CREATE POLICY "Users can manage their own projects" ON projects
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Tasks
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
CREATE POLICY "Users can manage their own tasks" ON tasks
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- User preferences
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Tags
DROP POLICY IF EXISTS "Users can manage their own tags" ON tags;
CREATE POLICY "Users can manage their own tags" ON tags
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Tag categories
DROP POLICY IF EXISTS "Users can manage their own tag categories" ON tag_categories;
CREATE POLICY "Users can manage their own tag categories" ON tag_categories
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Notes
DROP POLICY IF EXISTS "Users can manage their own notes" ON notes;
CREATE POLICY "Users can manage their own notes" ON notes
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Schedules
DROP POLICY IF EXISTS "Users can manage their own schedules" ON schedules;
CREATE POLICY "Users can manage their own schedules" ON schedules
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Documents
DROP POLICY IF EXISTS "Users can manage their own documents" ON documents;
CREATE POLICY "Users can manage their own documents" ON documents
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Plans
DROP POLICY IF EXISTS "Users can manage their own plans" ON plans;
CREATE POLICY "Users can manage their own plans" ON plans
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- ========================================
-- STEP 8: Performance Indexes
-- ========================================

-- Add optimized indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_projects_user_id_text ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_text ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id_text ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id_text ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_project_id_text ON schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id_text ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_categories_user_id_text ON tag_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id_text ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_project_id_text ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id_text ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id_text ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_id_text ON plans(user_id);

-- Task-specific index if task_id exists in schedules
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'schedules' AND column_name = 'task_id') THEN
        CREATE INDEX IF NOT EXISTS idx_schedules_task_id_text ON schedules(task_id);
        RAISE NOTICE 'Created index on schedules.task_id';
    END IF;
END $$;

-- Composite indexes for common filtering
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_text ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_user_status_text ON projects(user_id, status);

-- ========================================
-- STEP 9: Verification Queries
-- ========================================

-- Verify all ID columns are now TEXT
SELECT 'ID Columns Verification:' as info;
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE (column_name LIKE '%_id' OR column_name = 'id')
  AND table_schema = 'public'
  AND table_name IN ('projects', 'tasks', 'user_preferences', 'tags', 'tag_categories', 'notes', 'schedules', 'documents', 'plans', 'custom_users')
ORDER BY table_name, column_name;

-- Verify foreign key constraints exist
SELECT 'Foreign Key Constraints:' as info;
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Check for any remaining UUID columns
SELECT 'Remaining UUID Columns (should be empty):' as info;
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE data_type = 'uuid'
  AND table_schema = 'public'
  AND table_name NOT LIKE 'auth.%';

-- Commit the transaction
COMMIT;

-- Success message
SELECT '🎉 Phase 1 UUID Migration completed successfully!' as result;
SELECT 'All ID columns converted to TEXT with UUID format validation' as details;
SELECT 'Foreign key constraints recreated with custom_users table' as note;