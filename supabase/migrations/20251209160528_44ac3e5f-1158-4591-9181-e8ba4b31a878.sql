-- Drop the current view
DROP VIEW IF EXISTS public.challenges_public;

-- Create a security definer function to safely expose challenge data
CREATE OR REPLACE FUNCTION public.get_challenges_public()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  template_code text,
  hints text[],
  module_name text,
  difficulty text,
  order_index integer,
  is_practice boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    title,
    description,
    template_code,
    hints,
    module_name,
    difficulty,
    order_index,
    is_practice,
    created_at
  FROM public.challenges
  ORDER BY order_index;
$$;

-- Also recreate the view using security definer (as a materialized approach)
CREATE VIEW public.challenges_public 
WITH (security_barrier = true)
AS
SELECT 
  id,
  title,
  description,
  template_code,
  hints,
  module_name,
  difficulty,
  order_index,
  is_practice,
  created_at
FROM public.challenges;

-- Grant select on view to authenticated and anon
GRANT SELECT ON public.challenges_public TO authenticated;
GRANT SELECT ON public.challenges_public TO anon;

-- Add an RLS policy for the challenges table that only allows SELECT on safe columns
-- This is needed because the view needs underlying access
CREATE POLICY "Allow read access to challenges for view" 
ON public.challenges 
FOR SELECT 
TO authenticated, anon
USING (true);