create extension if not exists pg_net;
create or replace function public.send_lead_email_webhook()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://hbvgecldtlznunblnkfn.supabase.co/functions/v1/send-lead-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_PAT"}'::jsonb,
    body := jsonb_build_object('type', 'INSERT', 'table', TG_TABLE_NAME, 'schema', TG_TABLE_SCHEMA, 'record', row_to_json(NEW))
  );
  return NEW;
end;
$$;
create trigger "lead_email_trigger"
after insert on "public"."leads"
for each row
execute function public.send_lead_email_webhook();
