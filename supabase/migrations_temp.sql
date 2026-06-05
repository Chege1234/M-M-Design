-- 1. Update existing leads to 'Ongoing' first
UPDATE public.leads SET status = 'Ongoing' WHERE status NOT IN ('Ongoing', 'Completed');

-- 2. Drop old constraint and add new one
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'Ongoing';
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK (status IN ('Ongoing', 'Completed'));

-- 3. Create admin_notes table
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Trigger for updated_at
DROP TRIGGER IF EXISTS admin_notes_set_updated_at ON public.admin_notes;
CREATE TRIGGER admin_notes_set_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- 6. Admin policies for notes
DROP POLICY IF EXISTS "admin_notes_select" ON public.admin_notes;
CREATE POLICY "admin_notes_select" ON public.admin_notes FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin_notes_insert" ON public.admin_notes;
CREATE POLICY "admin_notes_insert" ON public.admin_notes FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_notes_update" ON public.admin_notes;
CREATE POLICY "admin_notes_update" ON public.admin_notes FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_notes_delete" ON public.admin_notes;
CREATE POLICY "admin_notes_delete" ON public.admin_notes FOR DELETE USING (public.is_admin());

-- 7. Admin read policy for contact_inquiries (update)
DROP POLICY IF EXISTS "Admins can update contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can update contact inquiries"
  ON public.contact_inquiries FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Allow anon inserts to leads from the edge function (service role bypasses RLS anyway)
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- 9. Create webhook trigger for contact_inquiries emails
CREATE OR REPLACE FUNCTION public.send_contact_email_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://hbvgecldtlznunblnkfn.supabase.co/functions/v1/send-lead-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_PAT"}'::jsonb,
    body := jsonb_build_object('type', 'INSERT', 'table', 'contact_inquiries', 'schema', TG_TABLE_SCHEMA, 'record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_inquiry_email_trigger ON public.contact_inquiries;
CREATE TRIGGER contact_inquiry_email_trigger
AFTER INSERT ON public.contact_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.send_contact_email_webhook();
