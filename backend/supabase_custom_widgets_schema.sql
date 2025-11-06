-- Supabase SQL Schema for Custom Code Widgets
-- Run this in Supabase SQL Editor to create the table

-- Create custom_widgets table
CREATE TABLE IF NOT EXISTS custom_widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    python_code TEXT NOT NULL,
    author VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    parameters JSONB DEFAULT '[]'::jsonb,
    category VARCHAR(100) DEFAULT 'processing',
    is_public BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create index for faster queries
CREATE INDEX idx_custom_widgets_name ON custom_widgets(name);
CREATE INDEX idx_custom_widgets_author ON custom_widgets(author);
CREATE INDEX idx_custom_widgets_created_at ON custom_widgets(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE custom_widgets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read public widgets
CREATE POLICY "Public widgets are viewable by everyone"
    ON custom_widgets FOR SELECT
    USING (is_public = true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can create widgets"
    ON custom_widgets FOR INSERT
    WITH CHECK (true);

-- Policy: Authors can update their own widgets
CREATE POLICY "Authors can update their own widgets"
    ON custom_widgets FOR UPDATE
    USING (auth.uid()::text = author);

-- Policy: Authors can delete their own widgets
CREATE POLICY "Authors can delete their own widgets"
    ON custom_widgets FOR DELETE
    USING (auth.uid()::text = author);

-- Add comment
COMMENT ON TABLE custom_widgets IS 'Stores user-created custom code widgets for community sharing';
