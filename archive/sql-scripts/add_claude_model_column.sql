-- Add missing claude model column to user_preferences table
-- Run this in your Supabase SQL Editor

-- Add the selected_claude_model column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'selected_claude_model') THEN
        ALTER TABLE public.user_preferences ADD COLUMN selected_claude_model VARCHAR(100) DEFAULT 'claude-3-5-sonnet-20241022';
    END IF;
END $$;

-- The claude_api_key column should already exist from the original schema
-- But add it if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'claude_api_key') THEN
        ALTER TABLE public.user_preferences ADD COLUMN claude_api_key TEXT;
    END IF;
END $$;

-- Add openai_api_key column if it doesn't exist (for completeness)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'openai_api_key') THEN
        ALTER TABLE public.user_preferences ADD COLUMN openai_api_key TEXT;
    END IF;
END $$;

-- Add selected_openai_model column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'selected_openai_model') THEN
        ALTER TABLE public.user_preferences ADD COLUMN selected_openai_model VARCHAR(100) DEFAULT 'gpt-4';
    END IF;
END $$;

-- Add gemini_api_key column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'gemini_api_key') THEN
        ALTER TABLE public.user_preferences ADD COLUMN gemini_api_key TEXT;
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND column_name IN ('selected_claude_model', 'claude_api_key', 'openai_api_key', 'selected_openai_model', 'gemini_api_key')
ORDER BY column_name;

-- Success message
SELECT 'API key columns added to user_preferences table successfully!' as status;