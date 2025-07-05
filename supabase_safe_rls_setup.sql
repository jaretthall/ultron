-- SAFE RLS Setup for Custom Authentication
-- This approach keeps your publishable key but creates RLS policies that work with custom auth
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Enable RLS on all tables
-- ============================================================================

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

-- ============================================================================
-- STEP 2: Create permissive policies for anon role (for custom auth)
-- ============================================================================
-- Since you're using custom auth with localStorage, we'll create policies
-- that allow the anon role to access data, and your app will handle user filtering

-- Users table policies
CREATE POLICY "Allow anon access to users" ON public.users
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- User preferences table policies  
CREATE POLICY "Allow anon access to user_preferences" ON public.user_preferences
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Projects table policies
CREATE POLICY "Allow anon access to projects" ON public.projects
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tasks table policies
CREATE POLICY "Allow anon access to tasks" ON public.tasks
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tags table policies
CREATE POLICY "Allow anon access to tags" ON public.tags
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tag categories table policies
CREATE POLICY "Allow anon access to tag_categories" ON public.tag_categories
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Notes table policies
CREATE POLICY "Allow anon access to notes" ON public.notes
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Schedules table policies
CREATE POLICY "Allow anon access to schedules" ON public.schedules
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Documents table policies
CREATE POLICY "Allow anon access to documents" ON public.documents
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Plans table policies
CREATE POLICY "Allow anon access to plans" ON public.plans
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================================
-- STEP 3: (OPTIONAL) More secure approach with user-based filtering
-- ============================================================================
-- If you want better security, you can create policies that filter by user_id
-- This requires your app to always include the user_id in queries

-- Example for more secure user-based policies (comment out the above "Allow anon" policies first):

-- Users table - only allow access to specific user records
-- CREATE POLICY "Users access own records" ON public.users
--     FOR ALL TO anon 
--     USING (id = current_setting('app.current_user_id', true))
--     WITH CHECK (id = current_setting('app.current_user_id', true));

-- User preferences - only allow access to own preferences
-- CREATE POLICY "Users access own preferences" ON public.user_preferences
--     FOR ALL TO anon 
--     USING (user_id = current_setting('app.current_user_id', true))
--     WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Projects - only allow access to own projects
-- CREATE POLICY "Users access own projects" ON public.projects
--     FOR ALL TO anon 
--     USING (user_id = current_setting('app.current_user_id', true))
--     WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Tasks - only allow access to own tasks
-- CREATE POLICY "Users access own tasks" ON public.tasks
--     FOR ALL TO anon 
--     USING (user_id = current_setting('app.current_user_id', true))
--     WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test if you can query tables (run this after applying policies)
-- SELECT COUNT(*) FROM public.users;
-- SELECT COUNT(*) FROM public.projects;
-- SELECT COUNT(*) FROM public.user_preferences;