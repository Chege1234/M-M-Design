import { createClient } from '@supabase/supabase-js';
import { LIAISON_CHAT_ANON_KEY, LIAISON_CHAT_URL } from './liaisonChat';

const PROJECT_REF = 'hbvgecldtlznunblnkfn';

function cleanEnv(value) {
  if (!value) return '';
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function jwtProjectRef(token) {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    return payload.ref || null;
  } catch {
    return null;
  }
}

function resolveSupabaseConfig() {
  const envUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
  const envKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

  const urlValid = envUrl.includes(PROJECT_REF);
  const keyValid =
    (envKey.startsWith('eyJ') && jwtProjectRef(envKey) === PROJECT_REF) ||
    envKey.startsWith('sb_publishable_');

  if (urlValid && keyValid) {
    return {
      url: envUrl.replace(/\/$/, ''),
      key: envKey,
      source: 'env',
    };
  }

  if (envUrl || envKey) {
    console.warn(
      '[Supabase] VITE_SUPABASE_* does not match project hbvgecldtlznunblnkfn — using built-in defaults for the data client.',
    );
  }

  return {
    url: LIAISON_CHAT_URL,
    key: LIAISON_CHAT_ANON_KEY,
    source: 'default',
  };
}

const config = resolveSupabaseConfig();

export const supabaseUrl = config.url;
export const supabaseAnonKey = config.key;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
  },
});

/** @deprecated Use callLiaisonChat from ./liaisonChat.js */
export async function invokeLiaisonChat(body) {
  const { callLiaisonChat } = await import('./liaisonChat');
  return callLiaisonChat(body);
}
