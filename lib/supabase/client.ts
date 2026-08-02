"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let cached: BrowserClient | null = null;

/** Singleton so auth state listeners aren't duplicated across renders. */
export function createClient(): BrowserClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
    );
  }
  cached ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
  return cached;
}
