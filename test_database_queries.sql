-- Manual test of database queries that are failing
-- This script tests the exact queries causing 406/400 errors

-- Test 1: Check if user_preferences table exists and its structure
\echo '=== Test 1: Check user_preferences table structure ==='
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Test 2: Check if the user exists in users table
\echo '=== Test 2: Check if user exists in users table ==='
SELECT id, email, created_at 
FROM public.users 
WHERE id = '3992e23b-3992-4992-8a73-1a73816b3992';

-- Test 3: Test the exact SELECT query that's failing (406 error)
\echo '=== Test 3: Test SELECT query (GET request) ==='
SELECT * FROM public.user_preferences 
WHERE user_id = '3992e23b-3992-4992-8a73-1a73816b3992';

-- Test 4: Check if there are any existing user_preferences records
\echo '=== Test 4: Check existing user_preferences records ==='
SELECT user_id, theme, notifications_enabled, language, timezone, created_at, updated_at
FROM public.user_preferences
LIMIT 10;

-- Test 5: Test INSERT operation (simulating the failing POST request)
\echo '=== Test 5: Test INSERT operation ==='
INSERT INTO public.user_preferences (
    user_id,
    theme,
    notifications_enabled,
    language,
    timezone,
    created_at,
    updated_at
) VALUES (
    '3992e23b-3992-4992-8a73-1a73816b3992',
    'dark',
    true,
    'en',
    'UTC',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    theme = EXCLUDED.theme,
    notifications_enabled = EXCLUDED.notifications_enabled,
    language = EXCLUDED.language,
    timezone = EXCLUDED.timezone,
    updated_at = NOW()
RETURNING *;

-- Test 6: Test the SELECT query again after INSERT
\echo '=== Test 6: Test SELECT query after INSERT ==='
SELECT * FROM public.user_preferences 
WHERE user_id = '3992e23b-3992-4992-8a73-1a73816b3992';

-- Test 7: Check for any constraints or triggers that might be causing issues
\echo '=== Test 7: Check constraints and triggers ==='
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_preferences'
    AND tc.table_schema = 'public';

-- Test 8: Check RLS status (should be false after our fix)
\echo '=== Test 8: Check RLS status ==='
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'user_preferences';

-- Test 9: Test UPDATE operation
\echo '=== Test 9: Test UPDATE operation ==='
UPDATE public.user_preferences 
SET theme = 'light', updated_at = NOW()
WHERE user_id = '3992e23b-3992-4992-8a73-1a73816b3992'
RETURNING *;

-- Test 10: Clean up test data (optional)
\echo '=== Test 10: Clean up test data (commented out) ==='
-- DELETE FROM public.user_preferences WHERE user_id = '3992e23b-3992-4992-8a73-1a73816b3992';

-- Test 11: Check if PostgREST API schema is correctly configured
\echo '=== Test 11: Check PostgREST configuration ==='
SHOW search_path;
SELECT current_database();
SELECT current_schema();

-- Test 12: Test with a different user_id to see if it's user-specific
\echo '=== Test 12: Test with different user_id ==='
INSERT INTO public.user_preferences (
    user_id,
    theme,
    notifications_enabled,
    language,
    timezone,
    created_at,
    updated_at
) VALUES (
    'test-user-id-12345',
    'dark',
    true,
    'en',
    'UTC',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    theme = EXCLUDED.theme,
    updated_at = NOW()
RETURNING *;

-- Check if the test user was created successfully
SELECT * FROM public.user_preferences WHERE user_id = 'test-user-id-12345';

-- Clean up test user
DELETE FROM public.user_preferences WHERE user_id = 'test-user-id-12345';