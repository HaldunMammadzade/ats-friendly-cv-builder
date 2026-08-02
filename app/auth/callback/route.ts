import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/site-url";

/**
 * Single landing point for every auth redirect:
 * - OAuth (Google) and PKCE email links → ?code=
 * - Classic email OTP links → ?token_hash=&type=
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(providerError)}`
    );
  }

  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  // Default post-auth destination; email confirm should never bounce back to signup.
  const next = safeNextPath(searchParams.get("next") ?? "/dashboard");

  const supabase = await createClient();

  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          "That link has expired or was already used. Request a new one."
        )}`
      );
    }

    if (otpType === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Sign-in link was missing its code.")}`
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
