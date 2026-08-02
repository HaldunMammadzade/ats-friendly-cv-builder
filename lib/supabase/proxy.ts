import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./env";

/**
 * Refreshes the Supabase session and returns a response carrying any rotated
 * auth cookies. Server Components cannot write cookies, so this is the only
 * place the refresh token gets rotated.
 *
 * The returned `response` must be the one sent to the client (or have its
 * cookies copied onto a redirect), otherwise the refreshed session is lost.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser() revalidates the token against Supabase; getSession() only reads
  // the cookie and must not be trusted for authorization decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response };
}

/** Copies refreshed auth cookies from `source` onto a redirect response. */
export function withAuthCookies(
  target: NextResponse,
  source: NextResponse
): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}
