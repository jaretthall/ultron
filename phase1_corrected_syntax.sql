-- Targeted UUID Fix with CORRECT PostgreSQL Syntax
-- This addresses the specific constraints found in your debug output

BEGIN;

-- STEP 1: Drop ALL foreign key constraints using proper ALTER TABLE syntax
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_project_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_task_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;

ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_project_id_fkey;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_task_id_fkey;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;

ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_user_id_fkey;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_task_id_fkey;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_user_id_fkey;

ALTER TABLE tag_categories DROP CONSTRAINT IF EXISTS tag_categories_user_id_fkey;

ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_category_id_fkey;
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_user_id_fkey;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- STEP 2: Convert ALL ID columns to TEXT (including the hidden task_id columns)
-- Projects
ALTER TABLE projects ALTER COLUMN id TYPE TEXT;
ALTER TABLE projects ALTER COLUMN user_id TYPE TEXT;

-- Tasks  
ALTER TABLE tasks ALTER COLUMN id TYPE TEXT;
ALTER TABLE tasks ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE tasks ALTER COLUMN project_id TYPE TEXT;

-- User preferences
ALTER TABLE user_preferences ALTER COLUMN id TYPE TEXT;
ALTER TABLE user_preferences ALTER COLUMN user_id TYPE TEXT;

-- Tags
ALTER TABLE tags ALTER COLUMN id TYPE TEXT;
ALTER TABLE tags ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE tags ALTER COLUMN category_id TYPE TEXT;

-- Tag categories
ALTER TABLE tag_categories ALTER COLUMN id TYPE TEXT;
ALTER TABLE tag_categories ALTER COLUMN user_id TYPE TEXT;

-- Notes (including task_id!)
ALTER TABLE notes ALTER COLUMN id TYPE TEXT;
ALTER TABLE notes ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE notes ALTER COLUMN project_id TYPE TEXT;
ALTER TABLE notes ALTER COLUMN task_id TYPE TEXT;

-- Schedules (including task_id!)
ALTER TABLE schedules ALTER COLUMN id TYPE TEXT;
ALTER TABLE schedules ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE schedules ALTER COLUMN project_id TYPE TEXT;
ALTER TABLE schedules ALTER COLUMN task_id TYPE TEXT;

-- Documents (including task_id!)
ALTER TABLE documents ALTER COLUMN id TYPE TEXT;
ALTER TABLE documents ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE documents ALTER COLUMN project_id TYPE TEXT;
ALTER TABLE documents ALTER COLUMN task_id TYPE TEXT;

-- Plans
ALTER TABLE plans ALTER COLUMN id TYPE TEXT;
ALTER TABLE plans ALTER COLUMN user_id TYPE TEXT;

-- STEP 3: Create custom_users table
CREATE TABLE IF NOT EXISTS custom_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    auth_type TEXT DEFAULT 'custom',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE custom_users ENABLE ROW LEVEL SECURITY;

-- STEP 4: Recreate foreign key constraints pointing to custom_users
-- Projects -> custom_users
ALTER TABLE projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tasks -> custom_users and projects
ALTER TABLE tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- User preferences -> custom_users
ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tag categories -> custom_users
ALTER TABLE tag_categories 
ADD CONSTRAINT tag_categories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tags -> custom_users and tag_categories
ALTER TABLE tags 
ADD CONSTRAINT tags_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE tags 
ADD CONSTRAINT tags_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE SET NULL;

-- Notes -> custom_users, projects, and tasks
ALTER TABLE notes 
ADD CONSTRAINT notes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE notes 
ADD CONSTRAINT notes_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE notes 
ADD CONSTRAINT notes_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- Schedules -> custom_users, projects, and tasks
ALTER TABLE schedules 
ADD CONSTRAINT schedules_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE schedules 
ADD CONSTRAINT schedules_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE schedules 
ADD CONSTRAINT schedules_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- Documents -> custom_users, projects, and tasks
ALTER TABLE documents 
ADD CONSTRAINT documents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE documents 
ADD CONSTRAINT documents_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE documents 
ADD CONSTRAINT documents_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- Plans -> custom_users
ALTER TABLE plans 
ADD CONSTRAINT plans_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- STEP 5: Add UUID format validation constraints
ALTER TABLE projects ADD CONSTRAINT projects_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

ALTER TABLE tasks ADD CONSTRAINT tasks_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

ALTER TABLE tags ADD CONSTRAINT tags_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

ALTER TABLE tag_categories ADD CONSTRAINT tag_categories_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

ALTER TABLE notes ADD CONSTRAINT notes_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

ALTER TABLE schedules ADD CONSTRAINT schedules_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

ALTER TABLE documents ADD CONSTRAINT documents_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

ALTER TABLE plans ADD CONSTRAINT plans_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

ALTER TABLE custom_users ADD CONSTRAINT custom_users_id_format_check 
CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

-- STEP 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id_text ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_text ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id_text ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id_text ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_project_id_text ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_task_id_text ON notes(task_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id_text ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_project_id_text ON schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_schedules_task_id_text ON schedules(task_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id_text ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id_text ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_task_id_text ON documents(task_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id_text ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_categories_user_id_text ON tag_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_id_text ON plans(user_id);

-- STEP 7: Set up custom auth function
CREATE OR REPLACE FUNCTION set_current_user_id(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 8: Update RLS policies for all tables
-- Custom users policy
DROP POLICY IF EXISTS "Users can manage their own custom user data" ON custom_users;
CREATE POLICY "Users can manage their own custom user data" ON custom_users
    FOR ALL USING (id = current_setting('app.current_user_id', true));

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

-- STEP 9: Final verification
SELECT 'Verification Results:' as info;

-- Check all tables have TEXT IDs now
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE (column_name LIKE '%_id' OR column_name = 'id')
  AND table_schema = 'public'
  AND table_name IN ('projects', 'tasks', 'user_preferences', 'tags', 'tag_categories', 'notes', 'schedules', 'documents', 'plans', 'custom_users')
ORDER BY table_name, column_name;

-- Check remaining UUID columns (should be empty except auth tables)
SELECT 
  'Remaining UUID columns:' as check,
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE data_type = 'uuid'
  AND table_schema = 'public'
  AND table_name NOT LIKE 'auth.%';

COMMIT;

SELECT '🎉 Phase 1 UUID Migration Complete!' as result;
SELECT 'All ID columns converted to TEXT, foreign keys recreated with custom_users' as summary;