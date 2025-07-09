-- Phase 1 UUID Migration Script
-- Ultron Productivity Command Center v3.0.7+
-- 
-- This script addresses UUID and ID type inconsistencies identified in Phase 1 audit
-- It standardizes all ID columns to use TEXT type for compatibility with custom auth system
--
-- IMPORTANT: Run this script in your Supabase SQL editor
-- BACKUP YOUR DATABASE BEFORE RUNNING THIS MIGRATION

-- Start transaction for atomic migration
BEGIN;

-- ========================================
-- STEP 1: Audit Current ID Column Types
-- ========================================

-- Check current ID column types (for verification)
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE (column_name LIKE '%_id' OR column_name = 'id')
  AND table_schema = 'public'
ORDER BY table_name, column_name;

-- ========================================
-- STEP 2: Create Custom Users Table for Custom Auth
-- ========================================

-- Create a custom users table for the dual auth system
-- This supports both Supabase auth and custom localStorage auth
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
CREATE POLICY "Users can manage their own custom user data" ON custom_users
    FOR ALL USING (id = current_setting('app.current_user_id', true));

-- ========================================
-- STEP 3: Backup Existing Data (Optional)
-- ========================================

-- Create backup tables for critical data (uncomment if needed)
-- CREATE TABLE projects_backup AS SELECT * FROM projects;
-- CREATE TABLE tasks_backup AS SELECT * FROM tasks;
-- CREATE TABLE user_preferences_backup AS SELECT * FROM user_preferences;

-- ========================================
-- STEP 4: Update Table Schemas to Use TEXT for ID Columns
-- ========================================

-- Drop foreign key constraints temporarily (we'll recreate them)
-- Note: Some of these may not exist, that's okay
DO $$ 
BEGIN
    -- Drop foreign key constraints that reference auth.users
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'projects_user_id_fkey') THEN
        ALTER TABLE projects DROP CONSTRAINT projects_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'tasks_user_id_fkey') THEN
        ALTER TABLE tasks DROP CONSTRAINT tasks_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'user_preferences_user_id_fkey') THEN
        ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'tags_user_id_fkey') THEN
        ALTER TABLE tags DROP CONSTRAINT tags_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'tag_categories_user_id_fkey') THEN
        ALTER TABLE tag_categories DROP CONSTRAINT tag_categories_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'notes_user_id_fkey') THEN
        ALTER TABLE notes DROP CONSTRAINT notes_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'schedules_user_id_fkey') THEN
        ALTER TABLE schedules DROP CONSTRAINT schedules_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'documents_user_id_fkey') THEN
        ALTER TABLE documents DROP CONSTRAINT documents_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'plans_user_id_fkey') THEN
        ALTER TABLE plans DROP CONSTRAINT plans_user_id_fkey;
    END IF;
    
    -- Drop project_id foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'tasks_project_id_fkey') THEN
        ALTER TABLE tasks DROP CONSTRAINT tasks_project_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'notes_project_id_fkey') THEN
        ALTER TABLE notes DROP CONSTRAINT notes_project_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'schedules_project_id_fkey') THEN
        ALTER TABLE schedules DROP CONSTRAINT schedules_project_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'documents_project_id_fkey') THEN
        ALTER TABLE documents DROP CONSTRAINT documents_project_id_fkey;
    END IF;
    
    -- Drop category_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'tags_category_id_fkey') THEN
        ALTER TABLE tags DROP CONSTRAINT tags_category_id_fkey;
    END IF;
END $$;

-- Update all ID columns to TEXT type
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

-- Schedules table
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

-- ========================================
-- STEP 5: Add ID Format Validation Constraints
-- ========================================

-- Add check constraints to ensure proper UUID format
-- Projects
ALTER TABLE projects 
ADD CONSTRAINT projects_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

-- Tasks
ALTER TABLE tasks 
ADD CONSTRAINT tasks_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

-- Custom users
ALTER TABLE custom_users 
ADD CONSTRAINT custom_users_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

-- ========================================
-- STEP 6: Recreate Foreign Key Constraints
-- ========================================

-- Note: These reference custom_users table for custom auth compatibility
-- You may need to adjust these based on your auth strategy

-- Projects foreign keys
ALTER TABLE projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tasks foreign keys
ALTER TABLE tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE,
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- User preferences foreign keys
ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tags foreign keys
ALTER TABLE tags 
ADD CONSTRAINT tags_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE,
ADD CONSTRAINT tags_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE SET NULL;

-- Tag categories foreign keys
ALTER TABLE tag_categories 
ADD CONSTRAINT tag_categories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Notes foreign keys
ALTER TABLE notes 
ADD CONSTRAINT notes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE,
ADD CONSTRAINT notes_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Schedules foreign keys
ALTER TABLE schedules 
ADD CONSTRAINT schedules_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE,
ADD CONSTRAINT schedules_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Documents foreign keys
ALTER TABLE documents 
ADD CONSTRAINT documents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE,
ADD CONSTRAINT documents_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Plans foreign keys
ALTER TABLE plans 
ADD CONSTRAINT plans_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- ========================================
-- STEP 7: Update RLS Policies for Custom Auth
-- ========================================

-- Update RLS policies to work with custom auth
-- Note: This requires setting a custom user context

-- Function to set current user context for custom auth
CREATE OR REPLACE FUNCTION set_current_user_id(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql;

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
-- (These may already exist, that's okay)

-- User-based query indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id_text ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_text ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id_text ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id_text ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id_text ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_categories_user_id_text ON tag_categories(user_id);

-- Composite indexes for common filtering
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_text ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_user_status_text ON projects(user_id, status);

-- ========================================
-- STEP 9: Verification Queries
-- ========================================

-- Verify the migration worked correctly
SELECT 'Migration verification:' as info;

-- Check column types are now TEXT
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE (column_name LIKE '%_id' OR column_name = 'id')
  AND table_schema = 'public'
  AND table_name IN ('projects', 'tasks', 'user_preferences', 'tags', 'tag_categories', 'notes', 'schedules', 'documents', 'plans', 'custom_users')
ORDER BY table_name, column_name;

-- Check foreign key constraints exist
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Check constraints for ID format validation
SELECT 
  tc.table_name, 
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
  AND cc.check_clause LIKE '%id%'
ORDER BY tc.table_name;

-- Commit the transaction
COMMIT;

-- ========================================
-- POST-MIGRATION NOTES
-- ========================================

/*
After running this migration:

1. Update your application code to use IdGenerator.generateId() for all new entities
2. Update the CustomAuthContext to work with the new custom_users table
3. Test all CRUD operations to ensure foreign key relationships work correctly
4. Consider running ANALYZE on all modified tables to update query planner statistics:
   
   ANALYZE projects;
   ANALYZE tasks;
   ANALYZE user_preferences;
   ANALYZE tags;
   ANALYZE tag_categories;
   ANALYZE notes;
   ANALYZE schedules;
   ANALYZE documents;
   ANALYZE plans;
   ANALYZE custom_users;

5. Monitor application logs for any UUID-related errors
6. Update any hardcoded UUID references in your application

The migration standardizes all ID columns to TEXT type while maintaining UUID format validation.
This provides compatibility with both Supabase auth and custom auth systems.
*/