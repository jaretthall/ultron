-- Diagnose 406 Errors in Beta Database

-- Check current table structure
SELECT 'user_preferences columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
ORDER BY ordinal_position;

SELECT 'users columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'user_preferences policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_preferences';

SELECT 'users policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Check if RLS is enabled
SELECT 'RLS status:' as info;
SELECT schemaname, tablename, rowsecurity, relforcerowsecurity
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename IN ('user_preferences', 'users');

-- Check permissions
SELECT 'Permissions:' as info;
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('user_preferences', 'users')
AND grantee IN ('anon', 'authenticated', 'public');

-- Try simple queries to see what fails
SELECT 'Test query user_preferences:' as info;
SELECT COUNT(*) as user_preferences_count FROM user_preferences;

SELECT 'Test query users:' as info;
SELECT COUNT(*) as users_count FROM users;