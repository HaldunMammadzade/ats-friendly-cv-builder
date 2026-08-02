import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

/**
 * Data access layer. Every server-side read of the current identity goes
 * through here so the auth check can't be forgotten at a call site.
 *
 * `cache` dedupes the network call within a single render pass or request.
 */

export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Redirects to the login page when signed out. Use in pages and layouts. */
export const requireUser = cache(async (): Promise<User> => {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
});

export const getProfile = cache(async (): Promise<ProfileRow | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data ?? null;
});

export function displayName(
  user: User | null,
  profile: ProfileRow | null
): string {
  return (
    profile?.full_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "there"
  );
}
