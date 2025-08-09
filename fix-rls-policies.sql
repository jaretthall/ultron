-- Fix Row Level Security policies for schedules table
-- Run this in your Supabase SQL editor

-- First, check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'schedules';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'schedules';

-- Disable RLS temporarily to test (you can re-enable later)
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;

-- Or, if you want to keep RLS enabled, create/update the policy
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can access their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can create their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for schedules
CREATE POLICY "Users can view their own schedules" ON public.schedules
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own schedules" ON public.schedules
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own schedules" ON public.schedules
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own schedules" ON public.schedules
    FOR DELETE USING (user_id = auth.uid()::text);

-- Check that the policies were created
SELECT * FROM pg_policies WHERE tablename = 'schedules';

-- Test query to see if you can access schedules
SELECT COUNT(*) FROM public.schedules;