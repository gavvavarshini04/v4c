-- Community voting table for complaint upvotes
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS complaint_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(complaint_id, user_id)
);

-- Allow authenticated users to vote and view votes
ALTER TABLE complaint_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vote counts" ON complaint_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON complaint_votes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own vote" ON complaint_votes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
