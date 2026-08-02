import { NextResponse, type NextRequest } from "next/server";

/**
 * Legacy email links that still point at /auth/confirm are forwarded to the
 * unified callback handler so both paths behave the same.
 */
export async function GET(request: NextRequest) {
  const target = new URL("/auth/callback", request.nextUrl.origin);

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  if (!target.searchParams.has("next")) {
    target.searchParams.set("next", "/dashboard");
  }

  return NextResponse.redirect(target);
}
