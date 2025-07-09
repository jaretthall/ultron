-- Cleanup Duplicate RLS Policies
-- Run this to remove old conflicting policies

-- ============================================================================
-- Remove old policies that might conflict with the new anon policies
-- ============================================================================

-- Drop old users table policies (these were designed for Supabase auth, not custom auth)
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- If you have any other old policies that might conflict, drop them here
-- You can check existing policies with this query first:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- ============================================================================
-- Verification - check for clean policy state
-- ============================================================================

-- This should show only the "Allow anon access" policies for each table
SELECT 
    tablename,
    policyname,
    cmd as operation,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check that all tables have RLS enabled and policies
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
    AND t.rowsecurity = true
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;