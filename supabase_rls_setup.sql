-- Enable Row Level Security (RLS) and create policies for all tables
-- Run this in your Supabase SQL Editor

-- First, let's enable RLS on all tables
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

-- Optional: Enable RLS on chat_messages if it exists
-- ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own record
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

-- Policy: Users can insert their own record
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- ============================================================================
-- USER PREFERENCES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- PROJECTS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own projects
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- TASKS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own tasks
CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own tasks
CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own tasks
CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- TAGS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own tags
CREATE POLICY "Users can view own tags" ON public.tags
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own tags
CREATE POLICY "Users can insert own tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own tags
CREATE POLICY "Users can update own tags" ON public.tags
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own tags
CREATE POLICY "Users can delete own tags" ON public.tags
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- TAG CATEGORIES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own tag categories
CREATE POLICY "Users can view own tag categories" ON public.tag_categories
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own tag categories
CREATE POLICY "Users can insert own tag categories" ON public.tag_categories
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own tag categories
CREATE POLICY "Users can update own tag categories" ON public.tag_categories
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own tag categories
CREATE POLICY "Users can delete own tag categories" ON public.tag_categories
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- NOTES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own notes
CREATE POLICY "Users can view own notes" ON public.notes
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own notes
CREATE POLICY "Users can insert own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes" ON public.notes
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes" ON public.notes
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- SCHEDULES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own schedules
CREATE POLICY "Users can view own schedules" ON public.schedules
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own schedules
CREATE POLICY "Users can insert own schedules" ON public.schedules
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own schedules
CREATE POLICY "Users can update own schedules" ON public.schedules
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own schedules
CREATE POLICY "Users can delete own schedules" ON public.schedules
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- DOCUMENTS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- PLANS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own plans
CREATE POLICY "Users can view own plans" ON public.plans
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own plans
CREATE POLICY "Users can insert own plans" ON public.plans
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own plans
CREATE POLICY "Users can update own plans" ON public.plans
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own plans
CREATE POLICY "Users can delete own plans" ON public.plans
    FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- CHAT MESSAGES TABLE POLICIES (if exists)
-- ============================================================================

-- Uncomment these if you have a chat_messages table:
-- CREATE POLICY "Users can view own messages" ON public.chat_messages
--     FOR SELECT USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can insert own messages" ON public.chat_messages
--     FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can update own messages" ON public.chat_messages
--     FOR UPDATE USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can delete own messages" ON public.chat_messages
--     FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify RLS is enabled:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_preferences', 'projects', 'tasks', 'tags', 'tag_categories', 'notes', 'schedules', 'documents', 'plans');

-- Run this to see all policies:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;