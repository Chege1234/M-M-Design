-- Drop duplicate trigger created via Supabase dashboard webhooks
DROP TRIGGER IF EXISTS on_new_lead ON public.leads;
