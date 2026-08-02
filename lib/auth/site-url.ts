import "server-only";

import { headers } from "next/headers";

/**
 * Absolute origin for auth redirect URLs.
 *
 * Supabase requires an exact match against its allow-list, so an explicit
 * NEXT_PUBLIC_SITE_URL always wins. The header fallback covers preview
 * deployments and local development where the origin varies.
 */
export async function getSiteUrl(): Promise<string> {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "");

  if (configured) return configured.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

/** Keeps post-login redirects on this origin. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}
