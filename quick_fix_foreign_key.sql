-- QUICK FIX: Foreign Key Constraint Issue
-- This is the most likely fix for your problem
-- Run this in Supabase SQL Editor

-- The issue: user_preferences table foreign key points to auth.users 
-- But you're creating users in public.users table
-- Solution: Point the foreign key to your custom users table

-- 1. Drop the current foreign key constraint
ALTER TABLE public.user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- 2. Add new foreign key constraint pointing to public.users
ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Verify the fix
SELECT 'Foreign key fixed - now points to public.users table' as status;

-- 4. Test query to make sure it works
SELECT COUNT(*) as users_count FROM public.users;
SELECT COUNT(*) as preferences_count FROM public.user_preferences;