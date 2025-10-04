-- Create access codes table for admin and team access
CREATE TABLE public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  role app_role NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CHECK ((role = 'admin' AND team_id IS NULL) OR (role = 'player' AND team_id IS NOT NULL))
);

-- Enable RLS on access_codes
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read access codes (needed for validation)
CREATE POLICY "Anyone can validate access codes"
ON public.access_codes
FOR SELECT
TO authenticated
USING (true);

-- Create sessions table to track active access code sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code_used TEXT NOT NULL,
  role app_role NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own session
CREATE POLICY "Users can view their own session"
ON public.sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own session
CREATE POLICY "Users can insert their own session"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update has_role function to check sessions instead of user_roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sessions
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's team from session
CREATE OR REPLACE FUNCTION public.get_user_team(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id
  FROM public.sessions
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Update match_screenshots RLS policies
DROP POLICY IF EXISTS "Players can insert their own screenshots" ON public.match_screenshots;

CREATE POLICY "Players can insert screenshots for their team"
ON public.match_screenshots
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'player') AND
  team_id = public.get_user_team(auth.uid())
);

-- Create indexes
CREATE INDEX idx_access_codes_code ON public.access_codes(code);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_team_id ON public.sessions(team_id);

-- Insert default admin access code
INSERT INTO public.access_codes (code, role)
VALUES ('ADMIN2024', 'admin');