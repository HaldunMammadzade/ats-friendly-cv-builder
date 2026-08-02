import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL, assertSupabaseConfigured } from "./env";

/**
 * Request-scoped client for Server Components, Route Handlers and Server
 * Actions. Never cache the returned value across requests — it is bound to the
 * current request's cookie jar.
 */
export async function createClient() {
  // Read cookies first: this is what opts the caller out of static rendering,
  // so an unconfigured build fails with a missing-env message at request time
  // rather than while prerendering.
  const cookieStore = await cookies();
  assertSupabaseConfigured();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the
          // session instead, so this is safe to swallow.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS entirely — only use it in trusted
 * server-side code paths, never behind a user-controlled identifier.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }
  assertSupabaseConfigured();

  return createServerClient<Database>(SUPABASE_URL, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
