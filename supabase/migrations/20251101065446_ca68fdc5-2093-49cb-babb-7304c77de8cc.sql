-- Fix security issue: Remove public access to access_codes table
-- Drop the insecure public SELECT policy
DROP POLICY IF EXISTS "Anyone can validate access codes" ON public.access_codes;

-- Create a secure server-side function to validate access codes
-- This function uses SECURITY DEFINER to bypass RLS and validate codes without exposing the entire table
CREATE OR REPLACE FUNCTION public.validate_access_code(input_code TEXT)
RETURNS TABLE(
  role app_role, 
  team_id UUID, 
  tournament_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ac.role, ac.team_id, ac.tournament_id
  FROM public.access_codes ac
  WHERE ac.code = input_code
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.validate_access_code(TEXT) TO anon, authenticated;