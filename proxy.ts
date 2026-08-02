import { NextResponse, type NextRequest } from "next/server";
import { updateSession, withAuthCookies } from "@/lib/supabase/proxy";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Renamed from `middleware` in Next.js 16. Runs on the Node.js runtime.
 *
 * This is an optimistic gate only: it keeps signed-out users off app routes and
 * rotates the Supabase session cookie. Real authorization lives in lib/auth/dal
 * and in the database's row level security policies.
 */

/** Pages a signed-in user should never see; they bounce to the dashboard. */
const AUTH_ONLY_PAGES = ["/login", "/signup", "/forgot-password"];

const APP_PREFIXES = ["/dashboard", "/cv", "/cover-letters", "/settings"];

const isMatch = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured) {
    if (pathname === "/setup") return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  const { user, response } = await updateSession(request);

  if (!user && isMatch(pathname, APP_PREFIXES)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + request.nextUrl.search);
    return withAuthCookies(NextResponse.redirect(login), response);
  }

  if (user && isMatch(pathname, AUTH_ONLY_PAGES)) {
    return withAuthCookies(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      response
    );
  }

  if (user && pathname === "/setup") {
    return withAuthCookies(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      response
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation output. API
    // routes are included so their session cookie is refreshed too.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
