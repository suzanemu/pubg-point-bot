-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view all teams in their tournament" ON public.teams;

-- Create a security definer function to get user's tournament ID
CREATE OR REPLACE FUNCTION public.get_user_tournament_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.tournament_id
  FROM public.sessions s
  JOIN public.teams t ON t.id = s.team_id
  WHERE s.user_id = _user_id
  LIMIT 1
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view teams in their tournament"
ON public.teams
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  tournament_id = get_user_tournament_id(auth.uid())
);