-- Debug script to check current schema state
-- Run this first to see what we're working with

-- Check ALL columns with UUID type
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE data_type = 'uuid'
  AND table_schema = 'public'
ORDER BY table_name, column_name;

-- Check ALL _id columns and their types
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE (column_name LIKE '%_id' OR column_name = 'id')
  AND table_schema = 'public'
ORDER BY table_name, column_name;

-- Check existing foreign key constraints
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;