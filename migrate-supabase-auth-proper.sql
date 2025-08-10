-- Proper Migration from Custom Auth to Supabase Auth
-- This script maps custom users to existing Supabase users by email

-- ===================================
-- 1. DIAGNOSTIC QUERIES
-- ===================================

-- Check custom users
SELECT 
    'Custom Users' as type,
    id, 
    email,
    created_at
FROM custom_users 
ORDER BY created_at
LIMIT 10;

-- Check Supabase auth users
SELECT 
    'Supabase Auth Users' as type,
    id, 
    email, 
    created_at 
FROM auth.users 
ORDER BY created_at
LIMIT 10;

-- Check current authentication status
SELECT 
    'Current Auth Status' as status,
    auth.uid() as current_supabase_user,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'Authenticated'
        ELSE 'NOT AUTHENTICATED'
    END as auth_status;

-- ===================================
-- 2. DATA ANALYSIS
-- ===================================

-- Show which custom users have data
SELECT 
    cu.id as custom_user_id,
    cu.email,
    COUNT(DISTINCT p.id) as projects_count,
    COUNT(DISTINCT t.id) as tasks_count,
    COUNT(DISTINCT up.id) as preferences_count,
    COUNT(DISTINCT n.id) as notes_count
FROM custom_users cu
LEFT JOIN projects p ON p.user_id::text = cu.id
LEFT JOIN tasks t ON t.user_id::text = cu.id  
LEFT JOIN user_preferences up ON up.user_id::text = cu.id
LEFT JOIN notes n ON n.user_id::text = cu.id
GROUP BY cu.id, cu.email
HAVING COUNT(DISTINCT p.id) + COUNT(DISTINCT t.id) + COUNT(DISTINCT up.id) + COUNT(DISTINCT n.id) > 0
ORDER BY projects_count DESC, tasks_count DESC;

-- ===================================
-- 3. MATCHING ANALYSIS
-- ===================================

-- Show which custom users can be matched to Supabase users
SELECT 
    cu.email as custom_email,
    cu.id as custom_user_id,
    su.id as supabase_user_id,
    su.email as supabase_email,
    CASE 
        WHEN su.id IS NOT NULL THEN 'MATCH FOUND'
        ELSE 'NO MATCH'
    END as match_status
FROM custom_users cu
LEFT JOIN auth.users su ON LOWER(cu.email) = LOWER(su.email)
ORDER BY match_status DESC, cu.email;

-- ===================================
-- 4. TEMPORARILY DISABLE RLS FOR MIGRATION
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

-- Enable daily_schedules if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_schedules') THEN
        ALTER TABLE daily_schedules DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ===================================
-- 5. PROPER USER-BY-USER MIGRATION
-- ===================================

DO $$
DECLARE
    custom_user RECORD;
    supabase_user RECORD;
    total_migrated INTEGER := 0;
    total_failed INTEGER := 0;
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
    RAISE NOTICE '=== STARTING USER-BY-USER MIGRATION ===';
    
    FOR custom_user IN SELECT * FROM custom_users LOOP
        -- Find matching Supabase user by email (case insensitive)
        SELECT * INTO supabase_user 
        FROM auth.users 
        WHERE LOWER(email) = LOWER(custom_user.email);
        
        IF supabase_user IS NOT NULL THEN
            RAISE NOTICE 'Migrating custom user % (%) to Supabase user %', 
                custom_user.email, custom_user.id, supabase_user.id;
            
            -- Update all records for this custom user to the matching Supabase user
            UPDATE projects SET user_id = supabase_user.id WHERE user_id::text = custom_user.id;
            GET DIAGNOSTICS projects_updated = ROW_COUNT;
            
            UPDATE tasks SET user_id = supabase_user.id WHERE user_id::text = custom_user.id;
            GET DIAGNOSTICS tasks_updated = ROW_COUNT;
            
            UPDATE user_preferences SET user_id = supabase_user.id WHERE user_id::text = custom_user.id;
            GET DIAGNOSTICS preferences_updated = ROW_COUNT;
            
            UPDATE notes SET user_id = supabase_user.id WHERE user_id::text = custom_user.id;
            GET DIAGNOSTICS notes_updated = ROW_COUNT;
            
            UPDATE schedules SET user_id = supabase_user.id WHERE user_id::text = custom_user.id;
            GET DIAGNOSTICS schedules_updated = ROW_COUNT;
            
            UPDATE documents SET user_id = supabase_user.id WHERE user_id::text = custom_user.id;
            GET DIAGNOSTICS documents_updated = ROW_COUNT;
            
            UPDATE plans SET user_id = supabase_user.id WHERE user_id::text = custom_user.id;
            GET DIAGNOSTICS plans_updated = ROW_COUNT;
            
            UPDATE tags SET user_id = supabase_user.id WHERE user_id::text = custom_user.id;
            GET DIAGNOSTICS tags_updated = ROW_COUNT;
            
            UPDATE tag_categories SET user_id = supabase_user.id WHERE user_id::text = custom_user.id;
            GET DIAGNOSTICS tag_categories_updated = ROW_COUNT;
            
            -- Update daily_schedules if it exists
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_schedules') THEN
                UPDATE daily_schedules SET user_id = supabase_user.id WHERE user_id::text = custom_user.id;
                GET DIAGNOSTICS daily_schedules_updated = ROW_COUNT;
            ELSE
                daily_schedules_updated := 0;
            END IF;
            
            -- Log migration details for this user
            IF projects_updated + tasks_updated + preferences_updated + notes_updated + 
               schedules_updated + documents_updated + plans_updated + tags_updated + 
               tag_categories_updated + daily_schedules_updated > 0 THEN
                RAISE NOTICE '  ✓ Migrated % projects, % tasks, % preferences, % notes, % schedules, % documents, % plans, % tags, % tag_categories, % daily_schedules', 
                    projects_updated, tasks_updated, preferences_updated, notes_updated, 
                    schedules_updated, documents_updated, plans_updated, tags_updated, 
                    tag_categories_updated, daily_schedules_updated;
            END IF;
            
            total_migrated := total_migrated + 1;
        ELSE
            RAISE NOTICE '✗ No Supabase user found for custom user % (email: %)', 
                custom_user.id, custom_user.email;
            total_failed := total_failed + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Successfully migrated: % users', total_migrated;
    RAISE NOTICE 'Failed to migrate: % users', total_failed;
    RAISE NOTICE '========================';
END $$;

-- ===================================
-- 6. RE-ENABLE RLS
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
-- 7. VERIFICATION
-- ===================================

-- Show migration results
SELECT 
    'Migration Verification' as status,
    COUNT(*) as total_records
FROM projects
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'User Preferences', COUNT(*) FROM user_preferences;

-- Show user distribution after migration
SELECT 
    'User Distribution' as info,
    user_id,
    COUNT(*) as records
FROM projects
GROUP BY user_id
UNION ALL
SELECT 'Tasks', user_id::text, COUNT(*) 
FROM tasks
GROUP BY user_id
ORDER BY records DESC;

-- ===================================
-- 8. NEXT STEPS
-- ===================================

SELECT 
    'MIGRATION COMPLETE!' as status,
    'Your data has been migrated to match email addresses between custom and Supabase users.' as result,
    'Next: Update your frontend code to use Supabase auth instead of custom auth.' as next_step;

-- ===================================
-- 9. CLEANUP (OPTIONAL - RUN LATER)
-- ===================================
-- Only run this after confirming everything works!
-- 
-- DROP TABLE IF EXISTS custom_users CASCADE;
-- DROP POLICY IF EXISTS "Users can manage their own custom user data" ON custom_users;