-- Check for constraints that might be causing 409 conflicts
-- Run this in your Supabase SQL editor

-- Check all constraints on schedules table
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'schedules'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Check for unique indexes
SELECT 
    i.relname AS index_name,
    a.attname AS column_name,
    ix.indisunique AS is_unique
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'schedules'
    AND t.relkind = 'r'
ORDER BY i.relname, a.attname;

-- Check current data to see if there are duplicates
SELECT 
    user_id, 
    title, 
    start_date, 
    COUNT(*) as count
FROM public.schedules 
GROUP BY user_id, title, start_date
HAVING COUNT(*) > 1;