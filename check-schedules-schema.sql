-- Check what columns actually exist in the schedules table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'schedules' 
AND table_schema = 'public'
ORDER BY ordinal_position;