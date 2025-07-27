-- Fix existing chat messages by reordering them with correct timestamps
-- This script will fix the corrupted message order in existing chats

-- First, let's see what we're working with
SELECT 
  chat_id,
  role,
  content,
  created_at,
  ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at) as current_order
FROM messages 
WHERE chat_id IN (
  SELECT DISTINCT chat_id FROM messages 
  WHERE content IN ('begin', 'start', 'teaching') 
  OR content LIKE '%What aspect%' 
  OR content LIKE '%What specific%'
)
ORDER BY chat_id, created_at;

-- Update timestamps to fix the order
-- This will give each message a sequential timestamp based on its position
UPDATE messages 
SET created_at = (
  SELECT base_time + (INTERVAL '1 second' * (ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at) - 1))
  FROM (
    SELECT 
      chat_id,
      MIN(created_at) as base_time
    FROM messages 
    GROUP BY chat_id
  ) base_times
  WHERE base_times.chat_id = messages.chat_id
)
WHERE chat_id IN (
  SELECT DISTINCT chat_id FROM messages 
  WHERE content IN ('begin', 'start', 'teaching') 
  OR content LIKE '%What aspect%' 
  OR content LIKE '%What specific%'
);

-- Verify the fix
SELECT 
  chat_id,
  role,
  content,
  created_at,
  ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at) as new_order
FROM messages 
WHERE chat_id IN (
  SELECT DISTINCT chat_id FROM messages 
  WHERE content IN ('begin', 'start', 'teaching') 
  OR content LIKE '%What aspect%' 
  OR content LIKE '%What specific%'
)
ORDER BY chat_id, created_at; 