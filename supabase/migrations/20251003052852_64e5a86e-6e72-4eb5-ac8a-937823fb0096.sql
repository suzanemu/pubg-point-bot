-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'player');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles - users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create teams table with admin ownership
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS policies for teams
CREATE POLICY "Anyone can view teams"
ON public.teams
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete teams"
ON public.teams
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create match_screenshots table
CREATE TABLE public.match_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    match_number INTEGER NOT NULL,
    screenshot_url TEXT NOT NULL,
    placement INTEGER,
    kills INTEGER,
    points INTEGER,
    analyzed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on match_screenshots
ALTER TABLE public.match_screenshots ENABLE ROW LEVEL SECURITY;

-- RLS policies for match_screenshots
CREATE POLICY "Players can view all screenshots"
ON public.match_screenshots
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Players can insert their own screenshots"
ON public.match_screenshots
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = player_id AND 
    public.has_role(auth.uid(), 'player')
);

CREATE POLICY "Admins can view all screenshots"
ON public.match_screenshots
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('match-screenshots', 'match-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage
CREATE POLICY "Players can upload their own screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'match-screenshots' AND
    public.has_role(auth.uid(), 'player')
);

CREATE POLICY "Users can view screenshots they have access to"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'match-screenshots' AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'player'))
);

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_teams_created_by ON public.teams(created_by);
CREATE INDEX idx_match_screenshots_team_id ON public.match_screenshots(team_id);
CREATE INDEX idx_match_screenshots_player_id ON public.match_screenshots(player_id);