-- Diagnose Foreign Key Constraint Issue
-- Run this in your Supabase SQL Editor to identify the problem

-- 1. Check the foreign key constraints on user_preferences table
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'user_preferences'
    AND tc.table_schema = 'public';

-- 2. Check what's actually in both tables
SELECT 'auth.users' as table_name, id, email, created_at FROM auth.users 
UNION ALL
SELECT 'public.users' as table_name, id, email, created_at FROM public.users;

-- 3. Check if the user ID exists in auth.users
SELECT 
    '3992e23b-3992-4399-8399-3992e23b3992' as user_id,
    EXISTS(SELECT 1 FROM auth.users WHERE id = '3992e23b-3992-4399-8399-3992e23b3992') as exists_in_auth_users,
    EXISTS(SELECT 1 FROM public.users WHERE id = '3992e23b-3992-4399-8399-3992e23b3992') as exists_in_public_users;

-- 4. Check user_preferences table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Show current contents of user_preferences (if any)
SELECT COUNT(*) as total_user_preferences FROM public.user_preferences;
SELECT * FROM public.user_preferences LIMIT 5;