$headers = @{
  "Authorization" = "Bearer YOUR_SUPABASE_PAT"
  "Content-Type" = "application/json"
}

function RunQuery($label, $sql) {
  Write-Host "$label..."
  $body = @{ query = $sql } | ConvertTo-Json
  try {
    $r = Invoke-RestMethod -Method POST -Uri "https://api.supabase.com/v1/projects/hbvgecldtlznunblnkfn/database/query" -Headers $headers -Body $body
    Write-Host "  OK"
    return $r
  } catch {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errBody = $reader.ReadToEnd()
    Write-Host "  ERROR: $errBody"
    return $null
  }
}

# Step 1: Drop the broken trigger on leads (no updated_at column)
RunQuery "Step 1: Drop leads_set_updated_at trigger" "DROP TRIGGER IF EXISTS leads_set_updated_at ON public.leads;"

# Step 2: Add updated_at column to leads  
RunQuery "Step 2: Add updated_at to leads" "ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();"

# Step 3: Re-create the trigger
RunQuery "Step 3: Re-create leads updated_at trigger" "CREATE TRIGGER leads_set_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();"

# Step 4: Update existing leads status
RunQuery "Step 4: Update leads to Ongoing" "UPDATE public.leads SET status = 'Ongoing' WHERE status NOT IN ('Ongoing', 'Completed');"

# Step 5: Set default and add constraint
RunQuery "Step 5: Set default and constraint" "ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'Ongoing'; ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK (status IN ('Ongoing', 'Completed'));"

# Step 6: Create admin_notes table
RunQuery "Step 6: Create admin_notes table" "CREATE TABLE IF NOT EXISTS public.admin_notes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, content text NOT NULL DEFAULT '', note_date date NOT NULL DEFAULT CURRENT_DATE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());"

# Step 7: Notes trigger
RunQuery "Step 7: Notes updated_at trigger" "DROP TRIGGER IF EXISTS admin_notes_set_updated_at ON public.admin_notes; CREATE TRIGGER admin_notes_set_updated_at BEFORE UPDATE ON public.admin_notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();"

# Step 8: RLS on notes
RunQuery "Step 8: Enable RLS on notes" "ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;"

# Step 9: Notes policies
RunQuery "Step 9: Notes select policy" "DROP POLICY IF EXISTS admin_notes_select ON public.admin_notes; CREATE POLICY admin_notes_select ON public.admin_notes FOR SELECT USING (public.is_admin());"
RunQuery "Step 9b: Notes insert policy" "DROP POLICY IF EXISTS admin_notes_insert ON public.admin_notes; CREATE POLICY admin_notes_insert ON public.admin_notes FOR INSERT WITH CHECK (public.is_admin());"
RunQuery "Step 9c: Notes update policy" "DROP POLICY IF EXISTS admin_notes_update ON public.admin_notes; CREATE POLICY admin_notes_update ON public.admin_notes FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());"
RunQuery "Step 9d: Notes delete policy" "DROP POLICY IF EXISTS admin_notes_delete ON public.admin_notes; CREATE POLICY admin_notes_delete ON public.admin_notes FOR DELETE USING (public.is_admin());"

# Step 10: Contact inquiry update policy
RunQuery "Step 10: Contact inquiry update policy" "DROP POLICY IF EXISTS `"Admins can update contact inquiries`" ON public.contact_inquiries; CREATE POLICY `"Admins can update contact inquiries`" ON public.contact_inquiries FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());"

# Step 11: Contact inquiry email trigger
$triggerSQL = @"
CREATE OR REPLACE FUNCTION public.send_contact_email_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
BEGIN
  PERFORM net.http_post(
    url := 'https://hbvgecldtlznunblnkfn.supabase.co/functions/v1/send-lead-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_PAT"}'::jsonb,
    body := jsonb_build_object('type', 'INSERT', 'table', 'contact_inquiries', 'schema', TG_TABLE_SCHEMA, 'record', row_to_json(NEW))
  );
  RETURN NEW;
END;
\$\$;
DROP TRIGGER IF EXISTS contact_inquiry_email_trigger ON public.contact_inquiries;
CREATE TRIGGER contact_inquiry_email_trigger
AFTER INSERT ON public.contact_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.send_contact_email_webhook();
"@
RunQuery "Step 11: Contact email trigger" $triggerSQL

Write-Host "`nAll migrations complete!"
