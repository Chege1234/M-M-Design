-- Revert is_admin function to SECURITY DEFINER to fix infinite recursion in RLS policies.
-- Using SECURITY INVOKER caused recursion when evaluating RLS on the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execute permissions: revoke from anon (to avoid RPC access), but allow authenticated users.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
