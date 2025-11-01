-- Add logo_url column to teams table for storing team logos
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create storage bucket for team logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can upload team logos" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update team logos" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete team logos" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view team logos" ON storage.objects;
END $$;

-- Add storage policies for team logos
CREATE POLICY "Admins can upload team logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'team-logos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update team logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'team-logos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete team logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'team-logos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view team logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'team-logos');