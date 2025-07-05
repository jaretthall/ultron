-- Fix All Foreign Key Constraints
-- This script fixes ALL tables to reference public.users instead of auth.users
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. Fix tasks table foreign key
-- ============================================================================

-- Drop the existing foreign key constraint
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

-- Add new foreign key constraint pointing to public.users
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ============================================================================
-- 2. Fix projects table foreign key
-- ============================================================================

-- Drop the existing foreign key constraint
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- Add new foreign key constraint pointing to public.users
ALTER TABLE public.projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ============================================================================
-- 3. Fix any other tables that might have the same issue
-- ============================================================================

-- Fix tags table
ALTER TABLE public.tags 
DROP CONSTRAINT IF EXISTS tags_user_id_fkey;

ALTER TABLE public.tags 
ADD CONSTRAINT tags_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix tag_categories table
ALTER TABLE public.tag_categories 
DROP CONSTRAINT IF EXISTS tag_categories_user_id_fkey;

ALTER TABLE public.tag_categories 
ADD CONSTRAINT tag_categories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix schedules table (the one causing the current error)
ALTER TABLE public.schedules 
DROP CONSTRAINT IF EXISTS schedules_user_id_fkey;

ALTER TABLE public.schedules 
ADD CONSTRAINT schedules_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix user_preferences table
ALTER TABLE public.user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix any other tables with user_id foreign keys
-- (Add more tables here if needed)

-- ============================================================================
-- 4. Verification - check all foreign key constraints now point to public.users
-- ============================================================================

SELECT 
    tc.table_name,
    tc.constraint_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.column_name = 'id'
ORDER BY tc.table_name;

-- ============================================================================
-- 5. Success message
-- ============================================================================

SELECT 'All foreign key constraints have been fixed to point to public.users table!' as status;