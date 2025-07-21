-- Database schema for Teachers Academy Chat Persistence with User Authentication
-- Run this in your Supabase SQL Editor

-- Create chats table with user_id
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table with user_id for extra security
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only see their own chats" ON chats;
DROP POLICY IF EXISTS "Users can only insert their own chats" ON chats;
DROP POLICY IF EXISTS "Users can only update their own chats" ON chats;
DROP POLICY IF EXISTS "Users can only delete their own chats" ON chats;

DROP POLICY IF EXISTS "Users can only see their own messages" ON messages;
DROP POLICY IF EXISTS "Users can only insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can only update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can only delete their own messages" ON messages;

-- Create RLS policies for chats table
CREATE POLICY "Users can only see their own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own chats" ON chats
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own chats" ON chats
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for messages table
CREATE POLICY "Users can only see their own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);

-- Optional: Create a function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create triggers to automatically set user_id
DROP TRIGGER IF EXISTS set_user_id_on_chats ON chats;
CREATE TRIGGER set_user_id_on_chats
  BEFORE INSERT ON chats
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_on_messages ON messages;
CREATE TRIGGER set_user_id_on_messages
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION set_user_id(); 