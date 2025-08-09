-- Fix notes and shopping lists schema to work with custom authentication
-- This fixes the 409 Conflict errors by using the correct users table reference

-- Drop existing tables to recreate with correct references
DROP TABLE IF EXISTS shopping_list_items CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
DROP TABLE IF EXISTS notes CASCADE;

-- Create notes table for storing user notes (referencing public.users)
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopping lists table (referencing public.users)
CREATE TABLE shopping_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('grocery', 'hardware', 'general', 'amazon', 'custom')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopping list items table
CREATE TABLE shopping_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(list_id);
CREATE INDEX idx_shopping_list_items_position ON shopping_list_items(list_id, position);

-- Enable RLS (Row Level Security)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- For custom authentication, we need to temporarily disable RLS or create permissive policies
-- Since our custom auth handles user isolation in the service layer, we'll create permissive policies

-- RLS Policies for notes (permissive for custom auth)
CREATE POLICY "Allow all operations on notes" ON notes FOR ALL TO public USING (true) WITH CHECK (true);

-- RLS Policies for shopping_lists (permissive for custom auth)
CREATE POLICY "Allow all operations on shopping_lists" ON shopping_lists FOR ALL TO public USING (true) WITH CHECK (true);

-- RLS Policies for shopping_list_items (permissive for custom auth)
CREATE POLICY "Allow all operations on shopping_list_items" ON shopping_list_items FOR ALL TO public USING (true) WITH CHECK (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Notes and shopping lists tables fixed for custom authentication!' as status;