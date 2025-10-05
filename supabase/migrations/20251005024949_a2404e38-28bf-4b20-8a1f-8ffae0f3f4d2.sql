-- Drop the global unique constraint on team name
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_name_key;

-- Add a composite unique constraint for team name within each tournament
ALTER TABLE public.teams ADD CONSTRAINT teams_tournament_name_unique UNIQUE (tournament_id, name);