-- Clean up duplicate RLS policies and fix permissions
-- This script removes old duplicate policies and ensures only the correct ones remain

-- ===================================
-- 1. DROP ALL OLD DUPLICATE POLICIES
-- ===================================

-- Drop old policies from documents table
DROP POLICY IF EXISTS "select_own" ON documents;
DROP POLICY IF EXISTS "insert_own" ON documents;
DROP POLICY IF EXISTS "update_own" ON documents;
DROP POLICY IF EXISTS "delete_own" ON documents;

-- Drop old policies from notes table
DROP POLICY IF EXISTS "select_own" ON notes;
DROP POLICY IF EXISTS "insert_own" ON notes;
DROP POLICY IF EXISTS "update_own" ON notes;
DROP POLICY IF EXISTS "delete_own" ON notes;

-- Drop old policies from plans table
DROP POLICY IF EXISTS "select_own" ON plans;
DROP POLICY IF EXISTS "insert_own" ON plans;
DROP POLICY IF EXISTS "update_own" ON plans;
DROP POLICY IF EXISTS "delete_own" ON plans;

-- Drop old policies from projects table
DROP POLICY IF EXISTS "select_own" ON projects;
DROP POLICY IF EXISTS "insert_own" ON projects;
DROP POLICY IF EXISTS "update_own" ON projects;
DROP POLICY IF EXISTS "delete_own" ON projects;

-- Drop old policies from schedules table
DROP POLICY IF EXISTS "select_own" ON schedules;
DROP POLICY IF EXISTS "insert_own" ON schedules;
DROP POLICY IF EXISTS "update_own" ON schedules;
DROP POLICY IF EXISTS "delete_own" ON schedules;

-- Drop old policies from tag_categories table
DROP POLICY IF EXISTS "select_own" ON tag_categories;
DROP POLICY IF EXISTS "insert_own" ON tag_categories;
DROP POLICY IF EXISTS "update_own" ON tag_categories;
DROP POLICY IF EXISTS "delete_own" ON tag_categories;

-- Drop old policies from tags table
DROP POLICY IF EXISTS "select_own" ON tags;
DROP POLICY IF EXISTS "insert_own" ON tags;
DROP POLICY IF EXISTS "update_own" ON tags;
DROP POLICY IF EXISTS "delete_own" ON tags;

-- Drop old policies from tasks table
DROP POLICY IF EXISTS "select_own" ON tasks;
DROP POLICY IF EXISTS "insert_own" ON tasks;
DROP POLICY IF EXISTS "update_own" ON tasks;
DROP POLICY IF EXISTS "delete_own" ON tasks;

-- Drop old policies from user_preferences table
DROP POLICY IF EXISTS "select_own" ON user_preferences;
DROP POLICY IF EXISTS "insert_own" ON user_preferences;
DROP POLICY IF EXISTS "update_own" ON user_preferences;
DROP POLICY IF EXISTS "delete_own" ON user_preferences;

-- ===================================
-- 2. VERIFY REMAINING POLICIES
-- ===================================

-- After running this script, run this query to verify only the correct policies remain:
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('user_preferences', 'projects', 'tasks', 'notes', 'schedules', 'documents', 'plans', 'daily_schedules', 'tags', 'tag_categories')
ORDER BY tablename, policyname;

-- You should see only these policies per table:
-- - Users can view own [table]
-- - Users can insert own [table]  
-- - Users can update own [table]
-- - Users can delete own [table]

-- ===================================
-- 3. TEST QUERIES
-- ===================================

-- Test that you can still access your data:
DO $$
DECLARE
    project_count INTEGER;
    task_count INTEGER;
BEGIN
    -- Count projects for current user
    SELECT COUNT(*) INTO project_count FROM projects WHERE user_id = auth.uid();
    RAISE NOTICE 'Projects accessible: %', project_count;
    
    -- Count tasks for current user
    SELECT COUNT(*) INTO task_count FROM tasks WHERE user_id = auth.uid();
    RAISE NOTICE 'Tasks accessible: %', task_count;
END $$;

-- ===================================
-- 4. VERIFY RLS IS WORKING
-- ===================================

-- This should return your data
SELECT 'Projects' as table_name, COUNT(*) as count FROM projects WHERE user_id = auth.uid()
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks WHERE user_id = auth.uid()
UNION ALL
SELECT 'Notes', COUNT(*) FROM notes WHERE user_id = auth.uid()
UNION ALL
SELECT 'Schedules', COUNT(*) FROM schedules WHERE user_id = auth.uid()
UNION ALL
SELECT 'Documents', COUNT(*) FROM documents WHERE user_id = auth.uid()
UNION ALL
SELECT 'Plans', COUNT(*) FROM plans WHERE user_id = auth.uid()
UNION ALL
SELECT 'Tags', COUNT(*) FROM tags WHERE user_id = auth.uid()
UNION ALL
SELECT 'Tag Categories', COUNT(*) FROM tag_categories WHERE user_id = auth.uid()
UNION ALL
SELECT 'User Preferences', COUNT(*) FROM user_preferences WHERE user_id = auth.uid();