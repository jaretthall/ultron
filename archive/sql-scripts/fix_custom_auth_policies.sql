-- Fix RLS policies for custom authentication system
-- Since you're using custom auth, not Supabase Auth, the policies need to be adjusted

-- For now, temporarily disable RLS to test if this fixes the connection
-- You can re-enable with proper policies later

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_categories DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'user_preferences', 'projects', 'tasks', 'notes', 'documents', 'plans', 'schedules', 'tags', 'tag_categories')
ORDER BY tablename;