-- Fix RLS Policies for Custom Authentication System
-- This script updates RLS policies to work with your custom_users table

-- ===================================
-- 1. EXAMINE CUSTOM USERS TABLE
-- ===================================
-- First, let's see the structure of your custom_users table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'custom_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data from custom_users (first 5 records)
SELECT * FROM custom_users LIMIT 5;

-- ===================================
-- 2. CHECK CURRENT AUTH STATUS
-- ===================================
-- Check what auth.uid() returns vs your custom auth
SELECT 
    auth.uid() as supabase_auth_uid,
    current_user as current_db_user,
    session_user as session_user;

-- ===================================
-- 3. APPROACH 1: UPDATE RLS POLICIES FOR CUSTOM AUTH
-- ===================================
-- We need to modify the policies to check against custom_users instead of auth.uid()
-- First, let's see if custom_users has a way to identify the current user

-- DROP existing policies and create new ones for custom auth
-- We'll need to determine how your custom auth identifies the current user

-- ===================================
-- 4. TEMPORARY FIX: DISABLE RLS FOR TESTING
-- ===================================
-- WARNING: This temporarily disables security - only for testing!

-- Disable RLS on main tables temporarily to test functionality
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE tag_categories DISABLE ROW LEVEL SECURITY;

-- Test if you can now see your data
SELECT 
    'projects' as table_name,
    COUNT(*) as total_records
FROM projects
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences;

-- ===================================
-- 5. CUSTOM AUTH HELPER FUNCTION
-- ===================================
-- We need to create a function to get the current custom user ID
-- This will depend on how your custom auth system works

-- Example helper function (you'll need to modify based on your custom auth):
CREATE OR REPLACE FUNCTION get_current_custom_user_id() 
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER
AS $$
    -- This is a placeholder - you'll need to implement based on your custom auth
    -- Possible options:
    -- 1. Check a custom JWT claim
    -- 2. Use session variables
    -- 3. Check localStorage values (if stored in a table)
    -- 4. Use current_setting() if you set user context
    
    -- Example assuming you store custom user context:
    SELECT current_setting('app.current_user_id', true)::UUID;
    
    -- Or if you can map from Supabase auth to custom users:
    -- SELECT cu.id FROM custom_users cu WHERE cu.supabase_user_id = auth.uid();
$$;

-- ===================================
-- 6. OPTION A: RE-ENABLE RLS WITH CUSTOM AUTH
-- ===================================
-- Once you determine how to get current custom user, re-enable RLS:

-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- etc...

-- And create new policies like:
-- CREATE POLICY "Custom auth users can view own projects"
-- ON projects FOR SELECT
-- USING (user_id = get_current_custom_user_id());

-- ===================================
-- 7. OPTION B: MIGRATE TO SUPABASE AUTH
-- ===================================
-- Alternative: migrate your custom users to use Supabase auth UUIDs
-- This would involve updating all user_id fields in your tables

-- Example migration (DANGEROUS - backup first!):
-- UPDATE projects SET user_id = (
--     SELECT supabase_user_id 
--     FROM custom_users 
--     WHERE custom_users.id = projects.user_id
-- );

-- ===================================
-- 8. CHECK WHAT WORKS NOW
-- ===================================
-- After disabling RLS, test if your app works:
SELECT 'RLS temporarily disabled - test your app now' as status;

-- Remember to re-enable RLS once you fix the authentication issue!