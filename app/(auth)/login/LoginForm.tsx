"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { TextInput } from "@/components/ui/Field";
import {
  Divider,
  FieldErrors,
  FormAlert,
  GoogleButton,
  SubmitButton,
} from "@/components/auth/AuthPieces";
import {
  signInWithMagicLink,
  signInWithPassword,
  type AuthState,
} from "@/app/auth/actions";

export default function LoginForm({
  next,
  initialError,
}: {
  next?: string;
  initialError?: string;
}) {
  const [mode, setMode] = useState<"password" | "magic">("password");

  const [passwordState, passwordAction] = useActionState<
    AuthState | undefined,
    FormData
  >(signInWithPassword, initialError ? { error: initialError } : undefined);

  const [magicState, magicAction] = useActionState<
    AuthState | undefined,
    FormData
  >(signInWithMagicLink, undefined);

  const state = mode === "password" ? passwordState : magicState;

  return (
    <div>
      <GoogleButton next={next} />
      <Divider label="or" />

      <FormAlert error={state?.error} message={state?.message} />

      {mode === "password" ? (
        <form action={passwordAction} className="space-y-4">
          <input type="hidden" name="next" value={next ?? "/dashboard"} />

          <div>
            <TextInput
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            <FieldErrors errors={passwordState?.fieldErrors?.email} />
          </div>

          <div>
            <TextInput
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
            <FieldErrors errors={passwordState?.fieldErrors?.password} />
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-ink-500 underline underline-offset-4 hover:text-ink-900"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <SubmitButton>Sign in</SubmitButton>
        </form>
      ) : (
        <form action={magicAction} className="space-y-4">
          <TextInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            hint="We'll email you a one-time sign-in link. No password needed."
            required
          />
          <SubmitButton>Send magic link</SubmitButton>
        </form>
      )}

      <button
        type="button"
        onClick={() => setMode(mode === "password" ? "magic" : "password")}
        className="mt-4 w-full text-center text-[13px] text-ink-500 underline underline-offset-4 hover:text-ink-900"
      >
        {mode === "password"
          ? "Sign in with a magic link instead"
          : "Use a password instead"}
      </button>
    </div>
  );
}
