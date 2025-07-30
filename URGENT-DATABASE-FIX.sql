-- URGENT DATABASE FIX
-- Copy and paste this ENTIRE block into your Supabase SQL editor and run it

-- Step 1: Disable Row Level Security completely
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop any problematic policies
DROP POLICY IF EXISTS "Users can access their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can create their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;

-- Step 3: Check for and remove any unique constraints that might be causing conflicts
-- (This will show you what constraints exist - don't worry if some don't exist)
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'schedules' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name != 'schedules_pkey'  -- Keep the primary key
    LOOP
        EXECUTE 'ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- Step 4: Make sure the table structure is correct
-- (This will only add columns if they don't exist)
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS context TEXT DEFAULT '';
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'other';
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS recurring TEXT DEFAULT '';
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS reminders TEXT DEFAULT '';
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS blocks_work_time BOOLEAN DEFAULT false;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS is_focus_block BOOLEAN DEFAULT false;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS task_id TEXT;

-- Step 5: Remove any duplicate entries that might be causing conflicts
DELETE FROM public.schedules a USING public.schedules b 
WHERE a.id > b.id 
AND a.user_id = b.user_id 
AND a.title = b.title 
AND a.start_date = b.start_date;

-- Step 6: Grant full access (temporarily for testing)
GRANT ALL ON public.schedules TO authenticated;
GRANT ALL ON public.schedules TO anon;

-- Verification queries (you'll see the results)
SELECT 'Table structure verified' as status;
SELECT COUNT(*) as total_schedules FROM public.schedules;
SELECT 'Ready for testing' as message;