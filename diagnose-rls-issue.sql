-- Diagnose RLS Issues - Why are we getting 0 records?

-- ===================================
-- 1. CHECK CURRENT USER
-- ===================================
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as current_user_email,
    auth.jwt() ->> 'role' as current_role;

-- ===================================
-- 2. CHECK IF DATA EXISTS IN TABLES
-- ===================================
-- Run with service role or as table owner to bypass RLS
SELECT 
    'projects' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM projects
UNION ALL
SELECT 'tasks', COUNT(*), COUNT(DISTINCT user_id) FROM tasks
UNION ALL
SELECT 'notes', COUNT(*), COUNT(DISTINCT user_id) FROM notes
UNION ALL
SELECT 'schedules', COUNT(*), COUNT(DISTINCT user_id) FROM schedules
UNION ALL
SELECT 'documents', COUNT(*), COUNT(DISTINCT user_id) FROM documents
UNION ALL
SELECT 'plans', COUNT(*), COUNT(DISTINCT user_id) FROM plans
UNION ALL
SELECT 'tags', COUNT(*), COUNT(DISTINCT user_id) FROM tags
UNION ALL
SELECT 'tag_categories', COUNT(*), COUNT(DISTINCT user_id) FROM tag_categories
UNION ALL
SELECT 'user_preferences', COUNT(*), COUNT(DISTINCT user_id) FROM user_preferences;

-- ===================================
-- 3. CHECK SAMPLE USER_IDS IN YOUR DATA
-- ===================================
-- See what user_ids actually exist in your tables
SELECT DISTINCT 'projects' as source_table, user_id FROM projects LIMIT 5
UNION ALL
SELECT DISTINCT 'tasks', user_id FROM tasks LIMIT 5
UNION ALL
SELECT DISTINCT 'user_preferences', user_id FROM user_preferences LIMIT 5;

-- ===================================
-- 4. CHECK IF YOUR USER EXISTS IN AUTH.USERS
-- ===================================
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE id = auth.uid();

-- ===================================
-- 5. TEMPORARILY DISABLE RLS TO TEST
-- ===================================
-- WARNING: Only do this for testing, re-enable immediately after!

-- To temporarily disable RLS and check if data exists:
-- ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
-- SELECT COUNT(*) FROM projects;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 6. CHECK FOR DATA WITH YOUR SPECIFIC USER ID
-- ===================================
-- Replace 'your-user-id-here' with your actual user ID from step 1
-- This bypasses RLS to check if you have any data at all

DO $$
DECLARE
    my_user_id UUID;
    project_count INTEGER;
    task_count INTEGER;
BEGIN
    -- Get current user ID
    my_user_id := auth.uid();
    
    RAISE NOTICE 'Current User ID: %', my_user_id;
    
    -- Check if this user has any data (bypassing RLS with a direct check)
    EXECUTE format('SELECT COUNT(*) FROM projects WHERE user_id = %L', my_user_id) INTO project_count;
    RAISE NOTICE 'Projects for this user: %', project_count;
    
    EXECUTE format('SELECT COUNT(*) FROM tasks WHERE user_id = %L', my_user_id) INTO task_count;
    RAISE NOTICE 'Tasks for this user: %', task_count;
END $$;

-- ===================================
-- 7. MIGRATION HELPER
-- ===================================
-- If you need to migrate existing data to your current user:
-- UPDATE projects SET user_id = auth.uid() WHERE user_id = 'old-user-id';
-- UPDATE tasks SET user_id = auth.uid() WHERE user_id = 'old-user-id';
-- etc...

-- ===================================
-- 8. CHECK CUSTOM AUTH VS SUPABASE AUTH
-- ===================================
-- Your app might be using custom auth with different user IDs
-- Check if there's a mismatch between custom auth and Supabase auth

SELECT 
    'Check if custom_users table exists and has different IDs' as note,
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'custom_users'
    ) as custom_users_table_exists;

-- If custom_users exists, check its data:
-- SELECT * FROM custom_users LIMIT 10;