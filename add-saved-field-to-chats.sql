-- Add saved field to chats table
-- This field indicates whether the user has explicitly saved the chat or not

-- Add the saved column with default value false
ALTER TABLE chats ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT false;

-- Update existing chats to be marked as saved (since they were already persisted)
UPDATE chats SET saved = true WHERE saved IS NULL;

-- Make the saved column NOT NULL after setting default values
ALTER TABLE chats ALTER COLUMN saved SET NOT NULL;

-- Add an index for better performance when filtering by saved status
CREATE INDEX IF NOT EXISTS idx_chats_saved ON chats(saved);

-- Update the RLS policy to include saved field in updates
DROP POLICY IF EXISTS "Users can only update their own chats" ON chats;
CREATE POLICY "Users can only update their own chats" ON chats
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); 