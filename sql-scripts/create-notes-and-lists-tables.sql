-- Create notes table for storing user notes
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopping lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('grocery', 'hardware', 'general', 'amazon', 'custom')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopping list items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON shopping_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_position ON shopping_list_items(list_id, position);

-- Enable RLS (Row Level Security)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Users can view their own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shopping_lists
CREATE POLICY "Users can view their own shopping lists" ON shopping_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shopping lists" ON shopping_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists" ON shopping_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists" ON shopping_lists
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shopping_list_items
CREATE POLICY "Users can view items in their lists" ON shopping_list_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shopping_lists 
            WHERE shopping_lists.id = shopping_list_items.list_id 
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create items in their lists" ON shopping_list_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM shopping_lists 
            WHERE shopping_lists.id = shopping_list_items.list_id 
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in their lists" ON shopping_list_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM shopping_lists 
            WHERE shopping_lists.id = shopping_list_items.list_id 
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items from their lists" ON shopping_list_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM shopping_lists 
            WHERE shopping_lists.id = shopping_list_items.list_id 
            AND shopping_lists.user_id = auth.uid()
        )
    );

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