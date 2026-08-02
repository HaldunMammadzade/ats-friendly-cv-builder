import "server-only";

import { headers } from "next/headers";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalHost(host: string): boolean {
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".local")
  );
}

/**
 * Absolute origin for auth redirect URLs (OAuth, email confirm, password reset).
 *
 * On Vercel/preview we prefer the live request host so a stale
 * NEXT_PUBLIC_SITE_URL=http://localhost:3000 in env cannot break production auth.
 */
export async function getSiteUrl(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host && isLocalHost(host) ? "http" : "https");

  if (host && !isLocalHost(host)) {
    return stripTrailingSlash(`${protocol}://${host}`);
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && !configured.includes("localhost")) {
    return stripTrailingSlash(configured);
  }

  const vercelHost =
    process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "";
  if (vercelHost) {
    return stripTrailingSlash(
      vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`
    );
  }

  if (configured) return stripTrailingSlash(configured);

  return host
    ? stripTrailingSlash(`${protocol}://${host}`)
    : "http://localhost:3000";
}

/** Keeps post-login redirects on this origin. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}
