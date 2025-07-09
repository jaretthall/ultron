-- Fix 409 errors on projects and tasks tables
-- Check and fix schema mismatches similar to user_preferences

-- Check projects table structure
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('projects', 'tasks')
ORDER BY table_name, ordinal_position;

-- Check if projects table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'projects'
) as projects_exists;

-- Check if tasks table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks'
) as tasks_exists;

-- Create projects table if it doesn't exist or has wrong schema
DROP TABLE IF EXISTS public.projects CASCADE;

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    context TEXT NOT NULL, -- AI context - detailed description for AI understanding
    goals TEXT[], -- JSON array of goals
    deadline TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'on-hold'
    project_context VARCHAR(50) NOT NULL DEFAULT 'personal', -- 'business' | 'personal' | 'hybrid'
    tags TEXT[], -- JSON array of tags
    business_relevance FLOAT DEFAULT 0.5,
    preferred_time_slots TEXT[], -- JSON array of time slots
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add foreign key constraint
    CONSTRAINT fk_projects_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create tasks table if it doesn't exist or has wrong schema
DROP TABLE IF EXISTS public.tasks CASCADE;

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID, -- Reference to projects.id
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    context TEXT NOT NULL, -- AI context - detailed description for AI understanding
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'urgent'
    estimated_hours FLOAT NOT NULL DEFAULT 1.0,
    status VARCHAR(50) NOT NULL DEFAULT 'todo', -- 'todo' | 'in-progress' | 'completed'
    progress INTEGER DEFAULT 0, -- 0-100 percentage of task completion
    dependencies TEXT[], -- JSON array of task IDs
    due_date TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    tags TEXT[], -- JSON array of tags
    category VARCHAR(100),
    task_context VARCHAR(50) DEFAULT 'inherited', -- 'personal' | 'business' | 'inherited'
    energy_level VARCHAR(20) DEFAULT 'medium', -- 'low' | 'medium' | 'high'
    notes TEXT,
    completion_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add foreign key constraints
    CONSTRAINT fk_tasks_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_deadline ON public.projects(deadline);

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Verify the table structures
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('projects', 'tasks')
ORDER BY table_name, ordinal_position;

-- Test inserting sample data
-- Insert a test project
INSERT INTO public.projects (
    user_id,
    title,
    context,
    goals,
    status,
    project_context,
    tags,
    business_relevance,
    created_at,
    updated_at
) VALUES (
    '3992e23b-3992-4992-8a73-1a73816b3992'::UUID,
    'Test Project',
    'A test project for verifying database connectivity',
    ARRAY['Test goal 1', 'Test goal 2'],
    'active',
    'personal',
    ARRAY['test', 'database'],
    0.5,
    NOW(),
    NOW()
) RETURNING *;

-- Insert a test task
INSERT INTO public.tasks (
    user_id,
    title,
    context,
    priority,
    estimated_hours,
    status,
    tags,
    category,
    created_at,
    updated_at
) VALUES (
    '3992e23b-3992-4992-8a73-1a73816b3992'::UUID,
    'Test Task',
    'A test task for verifying database connectivity',
    'medium',
    1.0,
    'todo',
    ARRAY['test', 'database'],
    'testing',
    NOW(),
    NOW()
) RETURNING *;

-- Verify data was inserted
SELECT COUNT(*) as project_count FROM public.projects WHERE user_id = '3992e23b-3992-4992-8a73-1a73816b3992'::UUID;
SELECT COUNT(*) as task_count FROM public.tasks WHERE user_id = '3992e23b-3992-4992-8a73-1a73816b3992'::UUID;