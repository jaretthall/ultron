-- Debug user_preferences table structure and data
-- Check if the table exists and has the right structure

-- Check if user_preferences table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences'
);

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Check if there's any data in the table
SELECT COUNT(*) as row_count FROM public.user_preferences;

-- Check if the specific user exists
SELECT * FROM public.user_preferences 
WHERE user_id = '3992e23b-3992-4992-8a73-1a73816b3992';

-- Check if the users table has this user
SELECT * FROM public.users 
WHERE id = '3992e23b-3992-4992-8a73-1a73816b3992';

-- Try a simple insert to see if that works
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
    updated_at = NOW()
RETURNING *;