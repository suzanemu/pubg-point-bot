-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view teams in accessible tournaments" ON public.teams;

-- Create new policy allowing players to view all teams in their tournament
CREATE POLICY "Users can view all teams in their tournament"
ON public.teams
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (
    EXISTS (
      SELECT 1 
      FROM sessions s
      JOIN teams user_team ON user_team.id = s.team_id
      WHERE s.user_id = auth.uid() 
        AND user_team.tournament_id = teams.tournament_id
    )
  )
);