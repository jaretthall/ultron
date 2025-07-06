-- Fix Foreign Key Constraint Issue
-- This script fixes the user_preferences foreign key to reference the correct table
-- Run this in your Supabase SQL Editor

-- OPTION 1: If user_preferences references auth.users, fix it to reference public.users
-- (This is likely the issue)

-- First, check what the constraint is currently pointing to:
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'user_preferences' 
  AND constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

-- Drop the existing foreign key constraint (replace constraint_name with actual name from above)
-- ALTER TABLE public.user_preferences DROP CONSTRAINT user_preferences_user_id_fkey;

-- Add new foreign key constraint pointing to public.users
-- ALTER TABLE public.user_preferences 
-- ADD CONSTRAINT user_preferences_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- OPTION 2: If you want to use auth.users instead (switch to Supabase auth)
-- Create a user in auth.users table for your custom auth user

-- First, let's see what auth provider is configured
-- INSERT INTO auth.users (
--     id,
--     email,
--     email_confirmed_at,
--     created_at,
--     updated_at,
--     aud,
--     role
-- ) VALUES (
--     '3992e23b-3992-4399-8399-3992e23b3992',
--     'justclay63@gmail.com',
--     NOW(),
--     NOW(),
--     NOW(),
--     'authenticated',
--     'authenticated'
-- ) ON CONFLICT (id) DO NOTHING;

-- OPTION 3: Check if the issue is with the user ID format
-- Let's see what the constraint actually expects
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'user_preferences' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- RECOMMENDED QUICK FIX:
-- Drop and recreate the foreign key to point to your custom users table

-- Step 1: Drop existing constraint
ALTER TABLE public.user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- Step 2: Add new constraint pointing to public.users
ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 3: Verify the fix worked
SELECT 
    tc.constraint_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'user_preferences' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- Step 4: Test that we can now create user preferences
-- INSERT INTO public.user_preferences (
--     user_id,
--     working_hours_start,
--     working_hours_end,
--     focus_block_duration,
--     break_duration,
--     priority_weight_deadline,
--     priority_weight_effort,
--     priority_weight_deps,
--     ai_provider,
--     selected_gemini_model
-- ) VALUES (
--     '3992e23b-3992-4399-8399-3992e23b3992',
--     '09:00',
--     '17:00',
--     90,
--     15,
--     0.4,
--     0.3,
--     0.3,
--     'gemini',
--     'gemini-1.5-flash'
-- ) ON CONFLICT (user_id) DO NOTHING;