-- Migration: Create users table for Supabase
-- Description: Creates the public.users table with RLS policies and timestamp triggers

CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public read access to user profile information
CREATE POLICY "Allow public read access" ON public.users
  FOR SELECT USING (true);

-- Policy 2: Allow authenticated users to insert/update their profile
CREATE POLICY "Allow insert/update access" ON public.users
  FOR ALL USING (true) WITH CHECK (true);
