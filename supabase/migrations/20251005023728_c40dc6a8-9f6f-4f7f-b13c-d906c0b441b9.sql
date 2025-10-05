-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  total_matches INTEGER NOT NULL CHECK (total_matches > 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Add tournament_id to teams table FIRST
ALTER TABLE public.teams
ADD COLUMN tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- Add tournament_id to access_codes table
ALTER TABLE public.access_codes
ADD COLUMN tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- Now create tournament policies
CREATE POLICY "Admins can view all tournaments"
ON public.tournaments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create tournaments"
ON public.tournaments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tournaments"
ON public.tournaments
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Players can view tournaments they're part of
CREATE POLICY "Players can view their tournament"
ON public.tournaments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.teams t ON t.id = s.team_id
    WHERE s.user_id = auth.uid()
    AND t.tournament_id = tournaments.id
  )
);

-- Update teams RLS to check tournament access
DROP POLICY IF EXISTS "Anyone can view teams" ON public.teams;
CREATE POLICY "Users can view teams in accessible tournaments"
ON public.teams
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.user_id = auth.uid()
    AND s.team_id = teams.id
  )
);

-- Create function to update tournaments updated_at
CREATE OR REPLACE FUNCTION public.update_tournaments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tournaments
CREATE TRIGGER update_tournaments_updated_at
BEFORE UPDATE ON public.tournaments
FOR EACH ROW
EXECUTE FUNCTION public.update_tournaments_updated_at();