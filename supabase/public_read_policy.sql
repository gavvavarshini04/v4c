-- Make complaint heatmap publicly visible (no login required)
-- Run this in Supabase Dashboard → SQL Editor

-- Allow anyone (including unauthenticated visitors) to view complaint locations
CREATE POLICY "Public can view all complaints" ON public.complaints
  FOR SELECT TO anon
  USING (true);
