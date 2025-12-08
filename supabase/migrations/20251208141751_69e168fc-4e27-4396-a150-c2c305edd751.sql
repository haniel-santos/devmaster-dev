-- Drop the view with SECURITY DEFINER and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.challenges_public;

CREATE VIEW public.challenges_public 
WITH (security_invoker = on)
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

-- Grant select on the view to authenticated and anon users
GRANT SELECT ON public.challenges_public TO authenticated;
GRANT SELECT ON public.challenges_public TO anon;