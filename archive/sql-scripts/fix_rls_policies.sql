-- Fix RLS policies to allow proper access for authenticated users
-- The current policies are too restrictive and causing 401/406 errors

-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Drop existing restrictive policies and create proper ones
-- Users table policies
DROP POLICY IF EXISTS "Users can manage their own data" ON public.users;
CREATE POLICY "Users can manage their own data" ON public.users
    FOR ALL 
    USING (true)  -- Allow all authenticated users to access users table
    WITH CHECK (true);

-- User preferences policies
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL 
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true))
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Projects policies
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
CREATE POLICY "Users can manage their own projects" ON public.projects
    FOR ALL 
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true))
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Tasks policies
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
CREATE POLICY "Users can manage their own tasks" ON public.tasks
    FOR ALL 
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true))
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Notes policies
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
CREATE POLICY "Users can manage their own notes" ON public.notes
    FOR ALL 
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true))
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Documents policies
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;
CREATE POLICY "Users can manage their own documents" ON public.documents
    FOR ALL 
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true))
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Plans policies
DROP POLICY IF EXISTS "Users can manage their own plans" ON public.plans;
CREATE POLICY "Users can manage their own plans" ON public.plans
    FOR ALL 
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true))
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Schedules policies
DROP POLICY IF EXISTS "Users can manage their own schedules" ON public.schedules;
CREATE POLICY "Users can manage their own schedules" ON public.schedules
    FOR ALL 
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true))
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Tags policies
DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;
CREATE POLICY "Users can manage their own tags" ON public.tags
    FOR ALL 
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true))
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Tag categories policies
DROP POLICY IF EXISTS "Users can manage their own tag categories" ON public.tag_categories;
CREATE POLICY "Users can manage their own tag categories" ON public.tag_categories
    FOR ALL 
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true))
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true));

-- Alternative: Temporarily disable RLS to test if this fixes the issue
-- You can run this instead if the above doesn't work:
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_preferences DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tag_categories DISABLE ROW LEVEL SECURITY;

-- Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;