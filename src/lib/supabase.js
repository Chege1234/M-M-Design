import { createClient } from '@supabase/supabase-js';

/**
 * Public Supabase project defaults (anon key is client-safe; RLS protects data).
 * Used when VITE_* env vars are missing on the host (common Vercel misconfiguration).
 */
export const SUPABASE_PROJECT_URL = 'https://hbvgecldtlznunblnkfn.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidmdlY2xkdGx6bnVuYmxua2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzQyNzksImV4cCI6MjA5NTcxMDI3OX0.-76sbTylZ-f6FHeL5XmFqfTvVcc-0VqpjWU4cYwhJAU';

export const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL?.trim() || SUPABASE_PROJECT_URL
).replace(/\/$/, '');

export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
  },
});

/** Call Melba liaison-chat with SDK invoke, then direct fetch if the client URL was wrong. */
export async function invokeLiaisonChat(body) {
  const { data, error } = await supabase.functions.invoke('liaison-chat', { body });

  if (!error && data && typeof data.reply === 'string') {
    return data;
  }

  if (error) {
    console.warn('liaison-chat invoke failed, retrying with fetch:', error.message || error);
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/liaison-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`liaison-chat HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
  }

  const payload = await response.json();
  if (!payload?.reply) {
    throw new Error('liaison-chat returned an empty response');
  }

  return payload;
}

if (
  import.meta.env.PROD &&
  (!import.meta.env.VITE_SUPABASE_URL?.trim() || !import.meta.env.VITE_SUPABASE_ANON_KEY?.trim())
) {
  console.warn(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set on this host — using built-in project defaults.',
  );
}
