-- Safe Database Schema Fix Script
-- Handles existing RLS policies and constraints properly

-- Enable UUID generation if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =======================
-- USER_PREFERENCES TABLE
-- =======================

-- Step 1: Drop existing policies that depend on user_id
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;
-- Additional common policy names
DROP POLICY IF EXISTS user_preferences_select ON public.user_preferences;
DROP POLICY IF EXISTS user_preferences_insert ON public.user_preferences;
DROP POLICY IF EXISTS user_preferences_update ON public.user_preferences;
DROP POLICY IF EXISTS user_preferences_delete ON public.user_preferences;
DROP POLICY IF EXISTS u_pref_select ON public.user_preferences;
DROP POLICY IF EXISTS u_pref_ins ON public.user_preferences;
DROP POLICY IF EXISTS u_pref_upd ON public.user_preferences;

-- Step 2: Drop foreign key constraints
ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey,
  DROP CONSTRAINT IF EXISTS fk_user_preferences_user_id;

-- Step 3: Drop unique constraints
ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_user_id_key;

-- Step 4: Alter column types to UUID
ALTER TABLE public.user_preferences
  ALTER COLUMN id TYPE uuid USING id::uuid,
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Step 5: Set default for id column
ALTER TABLE public.user_preferences
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 6: Add back constraints
ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);

-- Step 7: Recreate RLS policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =======================
-- PROJECTS TABLE
-- =======================

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_insert ON public.projects;
DROP POLICY IF EXISTS projects_update ON public.projects;
DROP POLICY IF EXISTS projects_delete ON public.projects;
DROP POLICY IF EXISTS projects_all ON public.projects;

-- Step 2: Drop foreign key constraints
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_user_id_fkey,
  DROP CONSTRAINT IF EXISTS fk_projects_user_id;

-- Step 3: Alter column types to UUID
ALTER TABLE public.projects
  ALTER COLUMN id TYPE uuid USING id::uuid,
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Step 4: Set default for id column
ALTER TABLE public.projects
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 5: Add back constraints
ALTER TABLE public.projects
  ADD CONSTRAINT projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 6: Recreate RLS policies
CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =======================
-- TASKS TABLE
-- =======================

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS tasks_select ON public.tasks;
DROP POLICY IF EXISTS tasks_insert ON public.tasks;
DROP POLICY IF EXISTS tasks_update ON public.tasks;
DROP POLICY IF EXISTS tasks_delete ON public.tasks;
DROP POLICY IF EXISTS tasks_all ON public.tasks;

-- Step 2: Drop foreign key constraints
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_user_id_fkey,
  DROP CONSTRAINT IF EXISTS fk_tasks_user_id,
  DROP CONSTRAINT IF EXISTS tasks_project_id_fkey,
  DROP CONSTRAINT IF EXISTS fk_tasks_project_id;

-- Step 3: Alter column types to UUID
ALTER TABLE public.tasks
  ALTER COLUMN id TYPE uuid USING id::uuid,
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN project_id TYPE uuid USING project_id::uuid;

-- Step 4: Set default for id column
ALTER TABLE public.tasks
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 5: Add back constraints
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT tasks_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Step 6: Recreate RLS policies
CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =======================
-- OTHER TABLES (if they exist)
-- =======================

-- Fix schedules table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedules') THEN
    -- Drop policies
    DROP POLICY IF EXISTS "Users can manage own schedules" ON public.schedules;
    DROP POLICY IF EXISTS schedules_all ON public.schedules;
    
    -- Drop constraints
    ALTER TABLE public.schedules
      DROP CONSTRAINT IF EXISTS schedules_user_id_fkey;
    
    -- Alter columns
    ALTER TABLE public.schedules
      ALTER COLUMN id TYPE uuid USING id::uuid,
      ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    
    ALTER TABLE public.schedules
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
    
    -- Add constraints
    ALTER TABLE public.schedules
      ADD CONSTRAINT schedules_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Add policy
    CREATE POLICY "Users can manage own schedules" ON public.schedules
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
      
    RAISE NOTICE 'Fixed schedules table';
  END IF;
END
$$;

-- Fix notes table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notes') THEN
    -- Drop policies
    DROP POLICY IF EXISTS "Users can manage own notes" ON public.notes;
    DROP POLICY IF EXISTS notes_all ON public.notes;
    
    -- Drop constraints
    ALTER TABLE public.notes
      DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
    
    -- Alter columns
    ALTER TABLE public.notes
      ALTER COLUMN id TYPE uuid USING id::uuid,
      ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    
    ALTER TABLE public.notes
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
    
    -- Add constraints
    ALTER TABLE public.notes
      ADD CONSTRAINT notes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Add policy
    CREATE POLICY "Users can manage own notes" ON public.notes
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
      
    RAISE NOTICE 'Fixed notes table';
  END IF;
END
$$;

-- Fix tags table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    -- Drop policies
    DROP POLICY IF EXISTS "Users can manage own tags" ON public.tags;
    DROP POLICY IF EXISTS tags_all ON public.tags;
    
    -- Drop constraints
    ALTER TABLE public.tags
      DROP CONSTRAINT IF EXISTS tags_user_id_fkey;
    
    -- Alter columns
    ALTER TABLE public.tags
      ALTER COLUMN id TYPE uuid USING id::uuid,
      ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    
    ALTER TABLE public.tags
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
    
    -- Add constraints
    ALTER TABLE public.tags
      ADD CONSTRAINT tags_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Add policy
    CREATE POLICY "Users can manage own tags" ON public.tags
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
      
    RAISE NOTICE 'Fixed tags table';
  END IF;
END
$$;

-- Final verification
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_preferences', 'projects', 'tasks', 'schedules', 'notes', 'tags')
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ Database schema fix completed successfully!' as status;