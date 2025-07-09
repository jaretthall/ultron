-- Fix user_preferences table schema - add missing columns
-- Root cause of 406/400 errors: missing columns in user_preferences table

-- First, check what columns currently exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Check the TypeScript interface to see what columns should exist
-- Based on the error, we need at least these columns:
-- - theme
-- - notifications_enabled
-- - language
-- - timezone
-- - created_at
-- - updated_at

-- Add missing columns to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'dark';

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verify the table structure after adding columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Now test the failing query to make sure it works
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

-- Test the SELECT query that was failing
SELECT * FROM public.user_preferences 
WHERE user_id = '3992e23b-3992-4992-8a73-1a73816b3992';