-- ============================================================================
-- Fix remaining advisor warnings (REVOKE must come AFTER function recreation)
-- ============================================================================

-- The previous migration re-created functions with CREATE OR REPLACE, which
-- resets the default EXECUTE grant to PUBLIC. We must REVOKE again.

-- Revoke from anon (trigger/internal functions should not be callable via RPC)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.send_contact_email_webhook() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.send_lead_email_webhook() FROM anon, authenticated, public;

-- is_admin: used in RLS policies, needs authenticated but not anon or public RPC
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;

-- set_updated_at: trigger function, no one should call it via RPC
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
