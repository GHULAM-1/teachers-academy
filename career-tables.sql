-- SQL queries to create career_chats and career_messages tables
-- Run this in your Supabase SQL Editor

-- Create career_chats table (same structure as chats table)
CREATE TABLE IF NOT EXISTS career_chats (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  saved BOOLEAN DEFAULT false,
  current_step TEXT DEFAULT 'discover',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create career_messages table (same as messages table + step attribute)
CREATE TABLE IF NOT EXISTS career_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES career_chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  step TEXT, -- New attribute for career step tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_career_chats_user_id ON career_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_career_chats_updated_at ON career_chats(updated_at);
CREATE INDEX IF NOT EXISTS idx_career_chats_saved ON career_chats(saved);
CREATE INDEX IF NOT EXISTS idx_career_messages_chat_id ON career_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_career_messages_user_id ON career_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_career_messages_step ON career_messages(step);
CREATE INDEX IF NOT EXISTS idx_career_messages_created_at ON career_messages(created_at);

-- Enable Row Level Security
ALTER TABLE career_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only see their own career chats" ON career_chats;
DROP POLICY IF EXISTS "Users can only insert their own career chats" ON career_chats;
DROP POLICY IF EXISTS "Users can only update their own career chats" ON career_chats;
DROP POLICY IF EXISTS "Users can only delete their own career chats" ON career_chats;

DROP POLICY IF EXISTS "Users can only see their own career messages" ON career_messages;
DROP POLICY IF EXISTS "Users can only insert their own career messages" ON career_messages;
DROP POLICY IF EXISTS "Users can only update their own career messages" ON career_messages;
DROP POLICY IF EXISTS "Users can only delete their own career messages" ON career_messages;

-- Create RLS policies for career_chats table
CREATE POLICY "Users can only see their own career chats" ON career_chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own career chats" ON career_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own career chats" ON career_chats
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own career chats" ON career_chats
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for career_messages table
CREATE POLICY "Users can only see their own career messages" ON career_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own career messages" ON career_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own career messages" ON career_messages
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own career messages" ON career_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Create triggers to automatically set user_id
DROP TRIGGER IF EXISTS set_user_id_on_career_chats ON career_chats;
CREATE TRIGGER set_user_id_on_career_chats
  BEFORE INSERT ON career_chats
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_on_career_messages ON career_messages;
CREATE TRIGGER set_user_id_on_career_messages
  BEFORE INSERT ON career_messages
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Create trigger to automatically update updated_at for career_chats
DROP TRIGGER IF EXISTS update_career_chats_updated_at ON career_chats;
CREATE TRIGGER update_career_chats_updated_at
    BEFORE UPDATE ON career_chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 