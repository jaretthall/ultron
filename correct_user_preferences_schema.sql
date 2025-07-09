-- Correct user_preferences table schema based on TypeScript interface
-- The previous script was wrong - theme column doesn't exist in the interface

-- First, let's see what columns currently exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Drop the table and recreate it with the correct schema from types.ts
DROP TABLE IF EXISTS public.user_preferences;

CREATE TABLE public.user_preferences (
    id VARCHAR(50) PRIMARY KEY, -- CUID
    user_id VARCHAR(50) NOT NULL, -- Foreign key to auth.users
    working_hours_start VARCHAR(5) NOT NULL DEFAULT '09:00', -- 'HH:MM'
    working_hours_end VARCHAR(5) NOT NULL DEFAULT '17:00', -- 'HH:MM'
    focus_block_duration INTEGER NOT NULL DEFAULT 60, -- minutes
    break_duration INTEGER NOT NULL DEFAULT 15, -- minutes
    priority_weight_deadline FLOAT NOT NULL DEFAULT 0.4, -- float
    priority_weight_effort FLOAT NOT NULL DEFAULT 0.3, -- float
    priority_weight_deps FLOAT NOT NULL DEFAULT 0.3, -- float
    instructions TEXT, -- Markdown
    business_hours_start VARCHAR(5) DEFAULT '09:00', -- 'HH:MM'
    business_hours_end VARCHAR(5) DEFAULT '17:00', -- 'HH:MM'
    business_days TEXT[], -- array of days
    personal_time_weekday_evening BOOLEAN DEFAULT true,
    personal_time_weekends BOOLEAN DEFAULT true,
    personal_time_early_morning BOOLEAN DEFAULT false,
    allow_business_in_personal_time BOOLEAN DEFAULT false,
    allow_personal_in_business_time BOOLEAN DEFAULT false,
    context_switch_buffer_minutes INTEGER DEFAULT 15,
    ai_provider VARCHAR(20) NOT NULL DEFAULT 'gemini', -- 'gemini' | 'claude' | 'openai'
    selected_gemini_model VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-flash',
    gemini_api_key VARCHAR(255),
    claude_api_key VARCHAR(255),
    selected_claude_model VARCHAR(50) DEFAULT 'claude-3-haiku-20240307',
    openai_api_key VARCHAR(255),
    selected_openai_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    focus_blocks TEXT[], -- array of strings
    preferred_time_slots TEXT[], -- array of strings
    business_relevance_default FLOAT DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add unique constraint on user_id
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Add foreign key constraint to users table
ALTER TABLE public.user_preferences 
ADD CONSTRAINT fk_user_preferences_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_preferences_ai_provider ON public.user_preferences(ai_provider);

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Test inserting a record for the user
INSERT INTO public.user_preferences (
    id,
    user_id,
    working_hours_start,
    working_hours_end,
    focus_block_duration,
    break_duration,
    priority_weight_deadline,
    priority_weight_effort,
    priority_weight_deps,
    ai_provider,
    selected_gemini_model,
    created_at,
    updated_at
) VALUES (
    'user_pref_3992e23b3992499281a73816b3992',
    '3992e23b-3992-4992-8a73-1a73816b3992',
    '09:00',
    '17:00',
    60,
    15,
    0.4,
    0.3,
    0.3,
    'gemini',
    'gemini-1.5-flash',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    working_hours_start = EXCLUDED.working_hours_start,
    working_hours_end = EXCLUDED.working_hours_end,
    focus_block_duration = EXCLUDED.focus_block_duration,
    break_duration = EXCLUDED.break_duration,
    priority_weight_deadline = EXCLUDED.priority_weight_deadline,
    priority_weight_effort = EXCLUDED.priority_weight_effort,
    priority_weight_deps = EXCLUDED.priority_weight_deps,
    ai_provider = EXCLUDED.ai_provider,
    selected_gemini_model = EXCLUDED.selected_gemini_model,
    updated_at = NOW()
RETURNING *;

-- Test the SELECT query that was failing
SELECT * FROM public.user_preferences 
WHERE user_id = '3992e23b-3992-4992-8a73-1a73816b3992';

-- Enable RLS if needed (currently disabled)
-- ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
--     FOR ALL 
--     USING (user_id = auth.uid()::text)
--     WITH CHECK (user_id = auth.uid()::text);