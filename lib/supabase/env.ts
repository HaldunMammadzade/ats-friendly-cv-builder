/**
 * Next.js inlines `process.env.NEXT_PUBLIC_*` only for statically written
 * references, so both key names are spelled out rather than looked up.
 * Supabase renamed the anon key to "publishable key"; either is accepted.
 */
/**
 * Next.js inlines `process.env.NEXT_PUBLIC_*` only for statically written
 * references, so both key names are spelled out rather than looked up.
 * Supabase renamed the anon key to "publishable key"; either is accepted.
 */

function normalizeSupabaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1\/?$/i, "");
}

export const SUPABASE_URL = normalizeSupabaseUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
);

export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** False when the app runs without credentials, which enables local-only mode. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);

export function assertSupabaseConfigured(): void {
  if (isSupabaseConfigured) return;
  throw new Error(
    "Supabase is not configured. Copy .env.example to .env.local and set " +
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}
