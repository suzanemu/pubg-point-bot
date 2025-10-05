-- Allow admins to insert access codes
CREATE POLICY "Admins can insert access codes"
ON public.access_codes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));