-- EMERGENCY DATABASE FIX
-- Run this immediately in your Supabase SQL editor to fix 409 conflicts

-- Step 1: Disable Row Level Security temporarily
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;

-- Step 2: Check what's causing conflicts
SELECT 
    constraint_name, 
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'schedules' 
    AND constraint_type = 'UNIQUE';

-- Step 3: Check for existing duplicates
SELECT 
    user_id, 
    title, 
    start_date, 
    COUNT(*) as duplicates
FROM public.schedules 
GROUP BY user_id, title, start_date
HAVING COUNT(*) > 1;

-- Step 4: If you find duplicates, remove them (CAREFUL!)
-- DELETE FROM public.schedules 
-- WHERE id NOT IN (
--     SELECT MIN(id) 
--     FROM public.schedules 
--     GROUP BY user_id, title, start_date
-- );

-- Step 5: Check current policies
SELECT * FROM pg_policies WHERE tablename = 'schedules';

-- After running this, try creating an event again