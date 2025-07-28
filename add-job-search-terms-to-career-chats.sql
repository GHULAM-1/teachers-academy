-- Add job_search_terms column to career_chats table
ALTER TABLE career_chats 
ADD COLUMN job_search_terms TEXT;

-- Add RLS policy for job_search_terms column
CREATE POLICY "Users can read their own career chat job search terms" ON career_chats
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own career chat job search terms" ON career_chats
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career chat job search terms" ON career_chats
FOR INSERT WITH CHECK (auth.uid() = user_id); 