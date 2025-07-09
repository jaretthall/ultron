-- Simple Step-by-Step UUID Fix
-- Run this after checking current state with debug_schema.sql

BEGIN;

-- STEP 1: Drop the problematic constraint first
DROP CONSTRAINT IF EXISTS schedules_task_id_fkey;

-- STEP 2: Find and convert ANY remaining UUID columns to TEXT
DO $$
DECLARE
    col_record RECORD;
BEGIN
    -- Get all UUID columns in public schema
    FOR col_record IN 
        SELECT table_name, column_name
        FROM information_schema.columns 
        WHERE table_schema = 'public'
            AND data_type = 'uuid'
            AND table_name NOT IN ('auth.users') -- Skip auth tables
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE TEXT', 
                          col_record.table_name, 
                          col_record.column_name);
            RAISE NOTICE 'Successfully converted %.% from UUID to TEXT', 
                         col_record.table_name, 
                         col_record.column_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to convert %.%: %', 
                         col_record.table_name, 
                         col_record.column_name, 
                         SQLERRM;
        END;
    END LOOP;
END $$;

-- STEP 3: Create custom_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    auth_type TEXT DEFAULT 'custom',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE custom_users ENABLE ROW LEVEL SECURITY;

-- STEP 4: Drop ALL foreign key constraints safely
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_schema = 'public'
            AND tc.table_name != 'custom_users'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 
                          constraint_record.table_name, 
                          constraint_record.constraint_name);
            RAISE NOTICE 'Dropped constraint %', constraint_record.constraint_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop constraint %: %', 
                         constraint_record.constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- STEP 5: Recreate essential foreign keys only (skip problematic ones for now)
-- Projects -> custom_users
ALTER TABLE projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tasks -> custom_users  
ALTER TABLE tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tasks -> projects
ALTER TABLE tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- User preferences -> custom_users
ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tags -> custom_users
ALTER TABLE tags 
ADD CONSTRAINT tags_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tag categories -> custom_users
ALTER TABLE tag_categories 
ADD CONSTRAINT tag_categories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Tags -> tag_categories
ALTER TABLE tags 
ADD CONSTRAINT tags_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE SET NULL;

-- STEP 6: Try to add schedules constraints (with error handling)
DO $$
BEGIN
    -- Schedules -> custom_users
    ALTER TABLE schedules 
    ADD CONSTRAINT schedules_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;
    
    -- Schedules -> projects
    ALTER TABLE schedules 
    ADD CONSTRAINT schedules_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    
    -- Schedules -> tasks (only if task_id column exists and both are TEXT)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'schedules' AND column_name = 'task_id') THEN
        
        -- Check if both columns are TEXT now
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'schedules' AND column_name = 'task_id') = 'text'
        AND (SELECT data_type FROM information_schema.columns 
             WHERE table_name = 'tasks' AND column_name = 'id') = 'text' THEN
            
            ALTER TABLE schedules 
            ADD CONSTRAINT schedules_task_id_fkey 
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Successfully added schedules_task_id_fkey';
        ELSE
            RAISE NOTICE 'Skipping schedules_task_id_fkey - type mismatch still exists';
        END IF;
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding schedules constraints: %', SQLERRM;
END $$;

-- STEP 7: Add remaining constraints
-- Notes -> custom_users and projects
ALTER TABLE notes 
ADD CONSTRAINT notes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE notes 
ADD CONSTRAINT notes_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Documents -> custom_users and projects  
ALTER TABLE documents 
ADD CONSTRAINT documents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

ALTER TABLE documents 
ADD CONSTRAINT documents_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Plans -> custom_users
ALTER TABLE plans 
ADD CONSTRAINT plans_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- STEP 8: Add validation constraints
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY['projects', 'tasks', 'user_preferences', 'tags', 'tag_categories', 'notes', 'schedules', 'documents', 'plans', 'custom_users'];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_id_format_check CHECK (id ~ ''^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'')', 
                          table_name, table_name);
            RAISE NOTICE 'Added ID format constraint to %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add constraint to %: %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- STEP 9: Update RLS policies
CREATE OR REPLACE FUNCTION set_current_user_id(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- STEP 10: Final verification
SELECT 'Migration Status Check:' as info;

-- Check remaining UUID columns
SELECT 
  'Remaining UUID columns:' as check_type,
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE data_type = 'uuid'
  AND table_schema = 'public'
  AND table_name NOT LIKE 'auth.%';

-- Check if schedules.task_id was converted
SELECT 
  'Schedules task_id type:' as check_type,
  table_name,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'schedules' 
  AND column_name = 'task_id';

-- Check tasks.id type
SELECT 
  'Tasks id type:' as check_type,
  table_name,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name = 'id';

COMMIT;

SELECT '✅ Phase 1 UUID Migration completed!' as result;