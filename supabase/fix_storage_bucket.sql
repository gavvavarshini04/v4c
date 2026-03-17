-- Run this in your Supabase SQL Editor if image uploads fail
-- It safely creates the complaint-images bucket if it doesn't exist

INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-images', 'complaint-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Anyone can view complaint images'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view complaint images" ON storage.objects FOR SELECT USING (bucket_id = ''complaint-images'')';
  END IF;
END $$;

-- Allow authenticated users to upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload complaint images'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can upload complaint images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''complaint-images'')';
  END IF;
END $$;
