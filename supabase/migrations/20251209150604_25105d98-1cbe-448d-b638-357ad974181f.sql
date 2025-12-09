-- Remove the permissive policy that allows all authenticated users to read challenges
DROP POLICY IF EXISTS "Authenticated users can view challenges" ON public.challenges;
DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;

-- The challenges table should only be accessed by:
-- 1. Service role (for Edge Functions like validate-code)
-- 2. Admin users (if/when implemented)
-- No client-side access needed since challenges_public view exists

-- Ensure RLS is enabled (it should already be)
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Note: With RLS enabled and no SELECT policy, only service_role can read this table
-- The challenges_public view (which excludes solution/test_code) is already available for clients