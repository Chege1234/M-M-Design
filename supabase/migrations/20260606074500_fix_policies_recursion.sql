-- Update profiles select policy to use is_admin() instead of direct EXISTS query, avoiding infinite RLS recursion.
DROP POLICY IF EXISTS "Users and admins can read profiles" ON public.profiles;
CREATE POLICY "Users and admins can read profiles"
  ON public.profiles
  FOR SELECT
  USING (
    (SELECT auth.uid()) = id
    OR
    public.is_admin()
  );

-- Update contact_inquiries select policy to use is_admin() instead of direct EXISTS query.
DROP POLICY IF EXISTS "Admins can read contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can read contact inquiries"
  ON public.contact_inquiries
  FOR SELECT
  USING (
    public.is_admin()
  );
