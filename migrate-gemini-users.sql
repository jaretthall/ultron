-- Migrate users from Gemini to Claude
-- This updates any users who have Gemini set as their AI provider

-- Update user_preferences to change ai_provider from 'gemini' to 'claude'
UPDATE user_preferences 
SET ai_provider = 'claude'
WHERE ai_provider = 'gemini';

-- Update selected_claude_model for users who don't have one set
UPDATE user_preferences 
SET selected_claude_model = 'claude-3-5-sonnet-20241022'
WHERE selected_claude_model IS NULL OR selected_claude_model = '';

-- Success message
SELECT 'Gemini users migrated to Claude successfully!' as status;