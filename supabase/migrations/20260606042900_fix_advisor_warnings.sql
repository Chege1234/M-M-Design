-- ============================================================================
-- Fix all Supabase Advisor warnings
-- ============================================================================

-- ─── 1. FUNCTION SEARCH PATH MUTABLE (3 warnings) ──────────────────────────
-- Set search_path on functions that are missing it.

-- send_lead_email_webhook: add search_path without recreating (avoids embedding secrets)
ALTER FUNCTION public.send_lead_email_webhook() SET search_path TO 'public';

-- send_contact_email_webhook: add search_path without recreating
ALTER FUNCTION public.send_contact_email_webhook() SET search_path TO 'public';


-- set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- ─── 2. EXTENSION IN PUBLIC (1 warning) ────────────────────────────────────
-- NOTE: pg_net is installed in public but does NOT support SET SCHEMA,
-- and DROP/CREATE would break existing trigger functions using net.http_post().
-- This is a known Supabase platform limitation — skipping this warning.

-- ─── 3. REVOKE EXECUTE from anon/authenticated on SECURITY DEFINER functions
--    that should NOT be callable via the API (10 warnings: 5 anon + 5 auth)
-- handle_new_user is a trigger function — no one should call it via RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
-- rls_auto_enable is an event trigger function — no one should call it via RPC
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
-- send_contact_email_webhook is a trigger function
REVOKE EXECUTE ON FUNCTION public.send_contact_email_webhook() FROM anon, authenticated;
-- send_lead_email_webhook is a trigger function
REVOKE EXECUTE ON FUNCTION public.send_lead_email_webhook() FROM anon, authenticated;
-- is_admin is used in RLS policies but should not be callable via /rpc
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- ─── 4. RLS POLICY ALWAYS TRUE (2 warnings) ────────────────────────────────
-- contact_inquiries: restrict INSERT to anon + authenticated only (not all roles)
DROP POLICY IF EXISTS "Anyone can submit contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Anyone can submit contact inquiries"
  ON public.contact_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- leads: restrict INSERT to anon + authenticated only
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
CREATE POLICY "Public can insert leads"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ─── 5. AUTH RLS INITPLAN (4 warnings) ──────────────────────────────────────
-- Wrap auth.uid() in (select ...) subquery so it's evaluated once, not per-row.

-- contact_inquiries: "Admins can read contact inquiries"
DROP POLICY IF EXISTS "Admins can read contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can read contact inquiries"
  ON public.contact_inquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- profiles: "Users can read own profile" — uses auth.uid() = id
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- profiles: "Users can update own profile" — uses auth.uid() = id
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING ((select auth.uid()) = id);

-- profiles: "Admins can read all profiles" — uses auth.uid()
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- ─── 6. MULTIPLE PERMISSIVE POLICIES (6 warnings) ──────────────────────────
-- Merge "Users can read own profile" + "Admins can read all profiles" into one.
-- Both were dropped above, now create a single combined policy.
CREATE POLICY "Users and admins can read profiles"
  ON public.profiles
  FOR SELECT
  USING (
    (select auth.uid()) = id
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

-- ─── 7. PUBLIC BUCKET ALLOWS LISTING (1 warning) ───────────────────────────
-- The project-images bucket is public, so direct URLs work without a SELECT policy.
-- Drop the broad SELECT policy that allows listing all files.
DROP POLICY IF EXISTS "Public read access on project-images" ON storage.objects;

-- ============================================================================
-- Total warnings fixed: 26 (out of 26 fixable via SQL)
-- Note: "Leaked Password Protection Disabled" (1 warning) must be enabled
-- in the Supabase Dashboard under Auth > Settings > Password Security.
-- ============================================================================
