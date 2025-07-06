-- RLS Setup for Additional Tables
-- Run this in your Supabase SQL Editor to fix the remaining tables

-- ============================================================================
-- Enable RLS on additional tables
-- ============================================================================

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Create policies for additional tables
-- ============================================================================

-- Chat messages table policies
CREATE POLICY "Allow anon access to chat_messages" ON public.chat_messages
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- AI suggestions table policies
CREATE POLICY "Allow anon access to ai_suggestions" ON public.ai_suggestions
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Sync events table policies
CREATE POLICY "Allow anon access to sync_events" ON public.sync_events
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Project tags junction table policies
CREATE POLICY "Allow anon access to project_tags" ON public.project_tags
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Task tags junction table policies
CREATE POLICY "Allow anon access to task_tags" ON public.task_tags
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Note tags junction table policies
CREATE POLICY "Allow anon access to note_tags" ON public.note_tags
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Schedule tags junction table policies
CREATE POLICY "Allow anon access to schedule_tags" ON public.schedule_tags
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Document tags junction table policies
CREATE POLICY "Allow anon access to document_tags" ON public.document_tags
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================================
-- Verification
-- ============================================================================

-- Check all tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true
ORDER BY tablename;

-- Check all policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('chat_messages', 'ai_suggestions', 'sync_events', 'project_tags', 'task_tags', 'note_tags', 'schedule_tags', 'document_tags')
ORDER BY tablename, policyname;

-- Double-check: Find any tables still without policies
SELECT DISTINCT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true 
    AND p.policyname IS NULL
ORDER BY t.tablename;