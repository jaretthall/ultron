-- Migrate from Custom Auth to Supabase Auth
-- This script helps transition your app to use Supabase's built-in authentication

-- ===================================
-- 1. FIRST - CHECK CURRENT STATE
-- ===================================

-- See what's in custom_users table
SELECT 
    'custom_users' as table_info,
    COUNT(*) as total_users
FROM custom_users;

-- Show structure of custom_users
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'custom_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Sample custom users data
SELECT * FROM custom_users LIMIT 5;

-- Check current Supabase auth users
SELECT 
    'auth_users' as table_info,
    COUNT(*) as total_auth_users
FROM auth.users;

-- ===================================
-- 2. TEMPORARILY DISABLE RLS FOR MIGRATION
-- ===================================

-- Disable RLS so we can work with the data during migration
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE tag_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedules DISABLE ROW LEVEL SECURITY;

-- ===================================
-- 3. CHECK DATA DISTRIBUTION
-- ===================================

-- See how much data each custom user has
SELECT 
    cu.id as custom_user_id,
    cu.email,
    COUNT(DISTINCT p.id) as projects_count,
    COUNT(DISTINCT t.id) as tasks_count,
    COUNT(DISTINCT up.id) as preferences_count
FROM custom_users cu
LEFT JOIN projects p ON p.user_id = cu.id
LEFT JOIN tasks t ON t.user_id = cu.id  
LEFT JOIN user_preferences up ON up.user_id = cu.id
GROUP BY cu.id, cu.email
ORDER BY projects_count DESC, tasks_count DESC;

-- ===================================
-- 4. MIGRATION STRATEGY
-- ===================================

-- APPROACH: Map your current data to your current Supabase auth user
-- This assumes you want to consolidate all existing data under your current login

DO $$
DECLARE
    current_supabase_user UUID;
    custom_users_count INTEGER;
    migration_summary TEXT := '';
BEGIN
    -- Get current Supabase user
    current_supabase_user := auth.uid();
    
    -- Count custom users
    SELECT COUNT(*) INTO custom_users_count FROM custom_users;
    
    RAISE NOTICE 'Current Supabase User: %', current_supabase_user;
    RAISE NOTICE 'Custom Users Found: %', custom_users_count;
    
    -- Check if we have a current user
    IF current_supabase_user IS NULL THEN
        RAISE NOTICE 'WARNING: No Supabase user is currently authenticated!';
        RAISE NOTICE 'Please log in through Supabase auth before running migration.';
    ELSE
        RAISE NOTICE 'Ready to migrate data to user: %', current_supabase_user;
    END IF;
END $$;

-- ===================================
-- 5. MIGRATION EXECUTION
-- ===================================
-- Run this section only after confirming you're logged in as the right Supabase user

DO $$
DECLARE
    current_supabase_user UUID;
    projects_updated INTEGER;
    tasks_updated INTEGER;
    preferences_updated INTEGER;
    notes_updated INTEGER;
    schedules_updated INTEGER;
    documents_updated INTEGER;
    plans_updated INTEGER;
    tags_updated INTEGER;
    tag_categories_updated INTEGER;
    daily_schedules_updated INTEGER;
BEGIN
    -- Get current Supabase user
    current_supabase_user := auth.uid();
    
    IF current_supabase_user IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found. Please log in first.';
    END IF;
    
    RAISE NOTICE 'Starting migration to user: %', current_supabase_user;
    
    -- Update all tables to use the current Supabase user ID
    UPDATE projects SET user_id = current_supabase_user;
    GET DIAGNOSTICS projects_updated = ROW_COUNT;
    
    UPDATE tasks SET user_id = current_supabase_user;
    GET DIAGNOSTICS tasks_updated = ROW_COUNT;
    
    UPDATE user_preferences SET user_id = current_supabase_user;
    GET DIAGNOSTICS preferences_updated = ROW_COUNT;
    
    UPDATE notes SET user_id = current_supabase_user;
    GET DIAGNOSTICS notes_updated = ROW_COUNT;
    
    UPDATE schedules SET user_id = current_supabase_user;
    GET DIAGNOSTICS schedules_updated = ROW_COUNT;
    
    UPDATE documents SET user_id = current_supabase_user;
    GET DIAGNOSTICS documents_updated = ROW_COUNT;
    
    UPDATE plans SET user_id = current_supabase_user;
    GET DIAGNOSTICS plans_updated = ROW_COUNT;
    
    UPDATE tags SET user_id = current_supabase_user;
    GET DIAGNOSTICS tags_updated = ROW_COUNT;
    
    UPDATE tag_categories SET user_id = current_supabase_user;
    GET DIAGNOSTICS tag_categories_updated = ROW_COUNT;
    
    -- Update daily_schedules if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_schedules') THEN
        UPDATE daily_schedules SET user_id = current_supabase_user;
        GET DIAGNOSTICS daily_schedules_updated = ROW_COUNT;
    ELSE
        daily_schedules_updated := 0;
    END IF;
    
    -- Log results
    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE 'Projects: % records updated', projects_updated;
    RAISE NOTICE 'Tasks: % records updated', tasks_updated;
    RAISE NOTICE 'User Preferences: % records updated', preferences_updated;
    RAISE NOTICE 'Notes: % records updated', notes_updated;
    RAISE NOTICE 'Schedules: % records updated', schedules_updated;
    RAISE NOTICE 'Documents: % records updated', documents_updated;
    RAISE NOTICE 'Plans: % records updated', plans_updated;
    RAISE NOTICE 'Tags: % records updated', tags_updated;
    RAISE NOTICE 'Tag Categories: % records updated', tag_categories_updated;
    RAISE NOTICE 'Daily Schedules: % records updated', daily_schedules_updated;
    
END $$;

-- ===================================
-- 6. RE-ENABLE RLS WITH CORRECT POLICIES
-- ===================================

-- Re-enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on daily_schedules if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_schedules') THEN
        ALTER TABLE daily_schedules ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ===================================
-- 7. VERIFY MIGRATION SUCCESS
-- ===================================

-- Test that you can now see your data with Supabase auth
SELECT 
    'projects' as table_name,
    COUNT(*) as accessible_records
FROM projects WHERE user_id = auth.uid()
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks WHERE user_id = auth.uid()
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences WHERE user_id = auth.uid()
UNION ALL
SELECT 'notes', COUNT(*) FROM notes WHERE user_id = auth.uid()
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules WHERE user_id = auth.uid()
UNION ALL
SELECT 'documents', COUNT(*) FROM documents WHERE user_id = auth.uid()
UNION ALL
SELECT 'plans', COUNT(*) FROM plans WHERE user_id = auth.uid()
UNION ALL
SELECT 'tags', COUNT(*) FROM tags WHERE user_id = auth.uid()
UNION ALL
SELECT 'tag_categories', COUNT(*) FROM tag_categories WHERE user_id = auth.uid();

-- ===================================
-- 8. CLEANUP CUSTOM AUTH TABLES (OPTIONAL)
-- ===================================
-- Only run this after confirming everything works!
-- 
-- DROP TABLE IF EXISTS custom_users CASCADE;
-- 
-- Also remove any custom auth related policies:
-- DROP POLICY IF EXISTS "Users can manage their own custom user data" ON custom_users;

-- ===================================
-- 9. FINAL STATUS CHECK
-- ===================================

SELECT 
    'Migration Status' as status,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'SUCCESS: Using Supabase Auth'
        ELSE 'ERROR: Not authenticated with Supabase'
    END as result,
    auth.uid() as current_user_id;