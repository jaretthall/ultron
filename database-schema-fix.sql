-- CORRECTED: Fix foreign key type mismatches by converting ALL UUID columns to TEXT
-- This matches the custom auth system that generates text-based IDs (not real UUIDs)

-- 1. Drop existing foreign key constraints
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- 2. Convert user_id columns from UUID to TEXT
ALTER TABLE public.projects ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.tasks ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_preferences ALTER COLUMN user_id TYPE TEXT;

-- 3. Convert projects.id from UUID to TEXT to match the pattern
ALTER TABLE public.projects ALTER COLUMN id TYPE TEXT;

-- 4. CRITICAL: Convert the id column in the users table to TEXT
--    This is required because CustomAuth generates TEXT-based IDs, not real UUIDs
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT;

-- 5. Convert tasks.project_id from UUID to TEXT to match projects.id
ALTER TABLE public.tasks ALTER COLUMN project_id TYPE TEXT;

-- 6. Re-create foreign key constraints with TEXT types (now all match!)
ALTER TABLE public.projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id);

ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- 7. Verify the changes
SELECT 'Schema updated successfully! All ID fields now use TEXT type to match CustomAuth system.' as status;