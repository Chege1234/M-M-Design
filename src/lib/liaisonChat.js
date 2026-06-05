/**
 * Melba (liaison-chat) client — always targets the M&M Supabase project.
 * Intentionally does not rely on VITE_* env for the function URL/key so a wrong
 * Vercel value cannot break chat while the rest of the app still uses env.
 */

const PROJECT_REF = 'hbvgecldtlznunblnkfn';

export const LIAISON_CHAT_URL = `https://${PROJECT_REF}.supabase.co`;

/** Legacy anon JWT (public, RLS-scoped). */
export const LIAISON_CHAT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidmdlY2xkdGx6bnVuYmxua2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzQyNzksImV4cCI6MjA5NTcxMDI3OX0.-76sbTylZ-f6FHeL5XmFqfTvVcc-0VqpjWU4cYwhJAU';

const LIAISON_CHAT_ENDPOINT = `${LIAISON_CHAT_URL}/functions/v1/liaison-chat`;

const CHAT_TIMEOUT_MS = 90_000;

function parseJsonPayload(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * @param {{ messages: Array<{ role: string, content: string }>, leadAlreadySaved?: boolean }} body
 */
export async function callLiaisonChat(body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  try {
    const response = await fetch(LIAISON_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LIAISON_CHAT_ANON_KEY}`,
        apikey: LIAISON_CHAT_ANON_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const rawText = await response.text();
    const payload = parseJsonPayload(rawText);

    if (!response.ok) {
      throw new Error(
        `liaison-chat HTTP ${response.status}: ${rawText?.slice(0, 200) || 'no body'}`,
      );
    }

    if (!payload?.reply) {
      throw new Error('liaison-chat returned an empty or invalid JSON body');
    }

    return payload;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('liaison-chat timed out — please try again');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
