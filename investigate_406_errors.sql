-- Investigate 406/400 errors by checking database structure and constraints
-- Error pattern: GET /user_preferences?select=*&user_id=eq.3992e23b-3992-4992-8a73-1a73816b3992 406
-- Error pattern: POST /user_preferences?on_conflict=user_id&select=* 400

-- 1. Check if user_preferences table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- 2. Check constraints on user_preferences table
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

-- 3. Check if there are any indexes on user_preferences
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_preferences'
    AND schemaname = 'public';

-- 4. Check current data in user_preferences table
SELECT COUNT(*) as total_rows FROM public.user_preferences;
SELECT * FROM public.user_preferences LIMIT 5;

-- 5. Check if the specific user exists in users table
SELECT id, email, created_at 
FROM public.users 
WHERE id = '3992e23b-3992-4992-8a73-1a73816b3992';

-- 6. Test the exact queries that are failing
-- This should match the GET request that's failing
SELECT * FROM public.user_preferences 
WHERE user_id = '3992e23b-3992-4992-8a73-1a73816b3992';

-- 7. Check if there are any triggers on user_preferences
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_preferences'
    AND event_object_schema = 'public';

-- 8. Check PostgREST configuration issues
-- Look for any issues with the API schema
SELECT current_setting('app.settings.api_schema', true) as api_schema;
SELECT current_setting('app.settings.api_extra_search_path', true) as extra_search_path;

-- 9. Test a simple insert that matches the failing POST request
-- This should help identify the issue with the upsert operation
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