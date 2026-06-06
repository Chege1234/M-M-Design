-- Add pinned column to leads and contact_inquiries tables to support pinning items to the top of the admin dashboard.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
