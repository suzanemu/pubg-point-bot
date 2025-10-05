-- Make match-screenshots bucket public so AI can analyze images
UPDATE storage.buckets 
SET public = true 
WHERE id = 'match-screenshots';