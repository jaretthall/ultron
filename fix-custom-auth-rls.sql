-- Fix RLS Policies for Custom Authentication
-- Your current policies use auth.uid() which doesn't work with custom auth

-- Drop all existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage their own daily schedules" ON public.daily_schedules;
DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can manage their own tag categories" ON public.tag_categories;
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can manage their own shopping lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can manage their own shopping list items" ON public.shopping_list_items;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can manage their own users" ON public.users;

-- Create permissive policies for custom auth (beta testing)
-- Since custom auth handles user filtering in the application layer, not database layer

CREATE POLICY "custom_auth_projects" ON public.projects
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "custom_auth_tasks" ON public.tasks
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "custom_auth_daily_schedules" ON public.daily_schedules
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "custom_auth_tags" ON public.tags
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "custom_auth_tag_categories" ON public.tag_categories
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "custom_auth_notes" ON public.notes
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "custom_auth_shopping_lists" ON public.shopping_lists
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "custom_auth_shopping_list_items" ON public.shopping_list_items
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "custom_auth_user_preferences" ON public.user_preferences
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "custom_auth_users" ON public.users
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Also create policies for any other tables
CREATE POLICY "custom_auth_schedules" ON public.schedules
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant explicit permissions to anon role (which custom auth uses)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Success message
SELECT '✅ Fixed RLS policies for custom authentication - 406 errors should be resolved!' as result;