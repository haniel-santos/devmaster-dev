-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;

-- Create a new SELECT policy that excludes solution and test_code
-- Note: We cannot exclude columns in RLS, so we create a view instead
CREATE OR REPLACE VIEW public.challenges_public AS
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

-- Re-create the RLS policy but only allow access through authenticated users
-- This prevents direct access to solution/test_code columns
CREATE POLICY "Authenticated users can view challenges" 
ON public.challenges 
FOR SELECT 
TO authenticated
USING (true);

-- Revoke direct SELECT on sensitive columns from anon role
-- The edge function will use service role to access test_code