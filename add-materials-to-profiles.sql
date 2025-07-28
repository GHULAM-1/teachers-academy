-- Add career materials storage to existing profiles table
-- Run this in your Supabase SQL Editor

-- Add material content columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_content TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_letter_content TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_content TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS outreach_content TEXT;

-- Add material metadata columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_letter_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS outreach_title TEXT;

-- Add material timestamps
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_letter_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS outreach_created_at TIMESTAMP WITH TIME ZONE;

-- Add material file names for download
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_file_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_letter_file_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_file_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS outreach_file_name TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_resume_created_at ON profiles(resume_created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_cover_letter_created_at ON profiles(cover_letter_created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_created_at ON profiles(linkedin_created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_outreach_created_at ON profiles(outreach_created_at); 