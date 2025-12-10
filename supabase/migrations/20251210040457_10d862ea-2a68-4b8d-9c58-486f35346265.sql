-- Remove the current public SELECT policy from challenges table
DROP POLICY IF EXISTS "Allow read access to challenges for view" ON public.challenges;

-- Create a restrictive policy that only allows the service role to read challenges
-- This prevents direct access to the solution and test_code fields from clients
CREATE POLICY "Only service role can read challenges"
ON public.challenges
FOR SELECT
USING (false);

-- Add explicit RLS policy to challenges_public view for clarity
-- Note: Views inherit security from underlying tables when using security_invoker,
-- but since challenges_public uses security_definer function, we need to ensure it works
ALTER VIEW public.challenges_public SET (security_invoker = false);