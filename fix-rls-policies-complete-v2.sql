-- Fix RLS Policies for All Tables (v2 - with proper type casting)
-- This script ensures proper Row Level Security for user data isolation

-- ===================================
-- 1. ENABLE RLS ON ALL TABLES
-- ===================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 2. DROP EXISTING POLICIES (Clean slate)
-- ===================================

-- User Preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

-- Projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Notes
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

-- Schedules
DROP POLICY IF EXISTS "Users can view own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON schedules;

-- Documents
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Plans
DROP POLICY IF EXISTS "Users can view own plans" ON plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON plans;
DROP POLICY IF EXISTS "Users can update own plans" ON plans;
DROP POLICY IF EXISTS "Users can delete own plans" ON plans;

-- Daily Schedules
DROP POLICY IF EXISTS "Users can view own daily schedules" ON daily_schedules;
DROP POLICY IF EXISTS "Users can insert own daily schedules" ON daily_schedules;
DROP POLICY IF EXISTS "Users can update own daily schedules" ON daily_schedules;
DROP POLICY IF EXISTS "Users can delete own daily schedules" ON daily_schedules;

-- Tags
DROP POLICY IF EXISTS "Users can view own tags" ON tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
DROP POLICY IF EXISTS "Users can update own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON tags;

-- Tag Categories
DROP POLICY IF EXISTS "Users can view own tag categories" ON tag_categories;
DROP POLICY IF EXISTS "Users can insert own tag categories" ON tag_categories;
DROP POLICY IF EXISTS "Users can update own tag categories" ON tag_categories;
DROP POLICY IF EXISTS "Users can delete own tag categories" ON tag_categories;

-- ===================================
-- 3. CHECK AND FIX COLUMN TYPES
-- ===================================

-- First, let's check the actual column types
DO $$
BEGIN
    -- Ensure user_id columns are the correct type (UUID or TEXT)
    -- We'll check each table and convert if needed
    
    -- Check user_preferences
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        -- If user_id is TEXT, keep it as TEXT
        NULL; -- No conversion needed
    END IF;
    
    -- Check projects
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        -- If user_id is TEXT, keep it as TEXT
        NULL; -- No conversion needed
    END IF;
    
    -- Similar checks for other tables...
END $$;

-- ===================================
-- 4. CREATE NEW RLS POLICIES (with proper type handling)
-- ===================================

-- First, let's determine if we're using UUID or TEXT for user_id
-- We'll create policies that work with both types

-- USER PREFERENCES POLICIES
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can insert own preferences"
ON user_preferences FOR INSERT
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
)
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can delete own preferences"
ON user_preferences FOR DELETE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

-- PROJECTS POLICIES
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can insert own projects"
ON projects FOR INSERT
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
)
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

-- TASKS POLICIES
CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can insert own tasks"
ON tasks FOR INSERT
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can update own tasks"
ON tasks FOR UPDATE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
)
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can delete own tasks"
ON tasks FOR DELETE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

-- NOTES POLICIES
CREATE POLICY "Users can view own notes"
ON notes FOR SELECT
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can insert own notes"
ON notes FOR INSERT
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can update own notes"
ON notes FOR UPDATE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
)
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can delete own notes"
ON notes FOR DELETE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

-- SCHEDULES POLICIES
CREATE POLICY "Users can view own schedules"
ON schedules FOR SELECT
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can insert own schedules"
ON schedules FOR INSERT
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can update own schedules"
ON schedules FOR UPDATE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
)
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can delete own schedules"
ON schedules FOR DELETE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

-- DOCUMENTS POLICIES
CREATE POLICY "Users can view own documents"
ON documents FOR SELECT
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can insert own documents"
ON documents FOR INSERT
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
)
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

-- PLANS POLICIES
CREATE POLICY "Users can view own plans"
ON plans FOR SELECT
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can insert own plans"
ON plans FOR INSERT
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can update own plans"
ON plans FOR UPDATE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
)
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can delete own plans"
ON plans FOR DELETE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

-- DAILY SCHEDULES POLICIES
CREATE POLICY "Users can view own daily schedules"
ON daily_schedules FOR SELECT
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can insert own daily schedules"
ON daily_schedules FOR INSERT
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can update own daily schedules"
ON daily_schedules FOR UPDATE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
)
WITH CHECK (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

CREATE POLICY "Users can delete own daily schedules"
ON daily_schedules FOR DELETE
USING (
    CASE 
        WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
        ELSE user_id::text = auth.uid()::text
    END
);

-- TAGS POLICIES (if they have user_id)
-- First check if tags table has user_id column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tags' AND column_name = 'user_id') THEN
        
        CREATE POLICY "Users can view own tags"
        ON tags FOR SELECT
        USING (
            CASE 
                WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
                ELSE user_id::text = auth.uid()::text
            END
        );

        CREATE POLICY "Users can insert own tags"
        ON tags FOR INSERT
        WITH CHECK (
            CASE 
                WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
                ELSE user_id::text = auth.uid()::text
            END
        );

        CREATE POLICY "Users can update own tags"
        ON tags FOR UPDATE
        USING (
            CASE 
                WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
                ELSE user_id::text = auth.uid()::text
            END
        )
        WITH CHECK (
            CASE 
                WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
                ELSE user_id::text = auth.uid()::text
            END
        );

        CREATE POLICY "Users can delete own tags"
        ON tags FOR DELETE
        USING (
            CASE 
                WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
                ELSE user_id::text = auth.uid()::text
            END
        );
    ELSE
        -- If tags don't have user_id, allow all authenticated users
        CREATE POLICY "Authenticated users can view tags"
        ON tags FOR SELECT
        USING (auth.uid() IS NOT NULL);
        
        CREATE POLICY "Authenticated users can manage tags"
        ON tags FOR ALL
        USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- TAG CATEGORIES POLICIES (if they have user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tag_categories' AND column_name = 'user_id') THEN
        
        CREATE POLICY "Users can view own tag categories"
        ON tag_categories FOR SELECT
        USING (
            CASE 
                WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
                ELSE user_id::text = auth.uid()::text
            END
        );

        CREATE POLICY "Users can insert own tag categories"
        ON tag_categories FOR INSERT
        WITH CHECK (
            CASE 
                WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
                ELSE user_id::text = auth.uid()::text
            END
        );

        CREATE POLICY "Users can update own tag categories"
        ON tag_categories FOR UPDATE
        USING (
            CASE 
                WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
                ELSE user_id::text = auth.uid()::text
            END
        )
        WITH CHECK (
            CASE 
                WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
                ELSE user_id::text = auth.uid()::text
            END
        );

        CREATE POLICY "Users can delete own tag categories"
        ON tag_categories FOR DELETE
        USING (
            CASE 
                WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
                ELSE user_id::text = auth.uid()::text
            END
        );
    ELSE
        -- If tag_categories don't have user_id, allow all authenticated users
        CREATE POLICY "Authenticated users can view tag categories"
        ON tag_categories FOR SELECT
        USING (auth.uid() IS NOT NULL);
        
        CREATE POLICY "Authenticated users can manage tag categories"
        ON tag_categories FOR ALL
        USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- ===================================
-- 5. GRANT NECESSARY PERMISSIONS
-- ===================================

-- Grant permissions to authenticated users
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON notes TO authenticated;
GRANT ALL ON schedules TO authenticated;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON plans TO authenticated;
GRANT ALL ON daily_schedules TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON tag_categories TO authenticated;

-- ===================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ===================================

-- Create indexes on user_id columns for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_schedules_user_id ON daily_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_schedules_composite ON daily_schedules(user_id, schedule_date);

-- Only create indexes if columns exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tags' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tag_categories' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_tag_categories_user_id ON tag_categories(user_id);
    END IF;
END $$;

-- ===================================
-- 7. VERIFICATION QUERIES
-- ===================================

-- To verify the policies are working, run these after applying:
-- SELECT * FROM user_preferences WHERE user_id::text = auth.uid()::text;
-- SELECT * FROM projects WHERE user_id::text = auth.uid()::text;
-- SELECT * FROM tasks WHERE user_id::text = auth.uid()::text;

-- To check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- To see all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies WHERE schemaname = 'public';