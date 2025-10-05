-- Add UPDATE policy for admins to edit match screenshots
CREATE POLICY "Admins can update match screenshots"
ON public.match_screenshots
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));