-- Alternative RLS setup for Custom Authentication System
-- This approach works with your localStorage-based custom auth
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- OPTION 1: DISABLE RLS TEMPORARILY FOR TESTING
-- ============================================================================
-- If you want to get the app working quickly for testing, you can disable RLS:
-- WARNING: This makes your data accessible to anyone with API access!
-- Only use this for development/testing, never in production

-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_preferences DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tag_categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPTION 2: CREATE A SERVICE ROLE APPROACH
-- ============================================================================
-- This uses your service role key to bypass RLS for your custom auth

-- First enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policies that allow service role to bypass RLS
-- The service role has BYPASS RLS privilege by default

-- For users table - allow service role to manage all operations
CREATE POLICY "Service role can manage users" ON public.users
    FOR ALL USING (current_setting('role') = 'service_role');

-- For user_preferences table
CREATE POLICY "Service role can manage user_preferences" ON public.user_preferences
    FOR ALL USING (current_setting('role') = 'service_role');

-- For projects table
CREATE POLICY "Service role can manage projects" ON public.projects
    FOR ALL USING (current_setting('role') = 'service_role');

-- For tasks table
CREATE POLICY "Service role can manage tasks" ON public.tasks
    FOR ALL USING (current_setting('role') = 'service_role');

-- For tags table
CREATE POLICY "Service role can manage tags" ON public.tags
    FOR ALL USING (current_setting('role') = 'service_role');

-- For tag_categories table
CREATE POLICY "Service role can manage tag_categories" ON public.tag_categories
    FOR ALL USING (current_setting('role') = 'service_role');

-- For notes table
CREATE POLICY "Service role can manage notes" ON public.notes
    FOR ALL USING (current_setting('role') = 'service_role');

-- For schedules table
CREATE POLICY "Service role can manage schedules" ON public.schedules
    FOR ALL USING (current_setting('role') = 'service_role');

-- For documents table
CREATE POLICY "Service role can manage documents" ON public.documents
    FOR ALL USING (current_setting('role') = 'service_role');

-- For plans table
CREATE POLICY "Service role can manage plans" ON public.plans
    FOR ALL USING (current_setting('role') = 'service_role');

-- ============================================================================
-- OPTION 3: SWITCH TO SUPABASE AUTH (RECOMMENDED FOR PRODUCTION)
-- ============================================================================
-- For production, you should consider switching to Supabase's built-in auth
-- This would require changes to your authentication flow but provides better security

-- First, enable RLS on all tables (same as above)
-- Then create policies based on auth.uid():

-- Example for users table with Supabase auth:
-- CREATE POLICY "Users can view own data" ON public.users
--     FOR SELECT USING (auth.uid()::text = id);

-- CREATE POLICY "Users can insert own data" ON public.users
--     FOR INSERT WITH CHECK (auth.uid()::text = id);

-- CREATE POLICY "Users can update own data" ON public.users
--     FOR UPDATE USING (auth.uid()::text = id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'user_preferences', 'projects', 'tasks', 'tags', 'tag_categories', 'notes', 'schedules', 'documents', 'plans')
ORDER BY tablename;

-- Check all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;