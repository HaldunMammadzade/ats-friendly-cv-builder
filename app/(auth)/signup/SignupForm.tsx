"use client";

import { useActionState } from "react";
import { TextInput } from "@/components/ui/Field";
import {
  Divider,
  FieldErrors,
  FormAlert,
  GoogleButton,
  SubmitButton,
} from "@/components/auth/AuthPieces";
import { signUpWithPassword, type AuthState } from "@/app/auth/actions";

export default function SignupForm() {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    signUpWithPassword,
    undefined
  );

  return (
    <div>
      <GoogleButton next="/dashboard" />
      <Divider label="or" />

      <FormAlert error={state?.error} message={state?.message} />

      <form action={action} className="space-y-4">
        <div>
          <TextInput
            label="Full name"
            name="fullName"
            autoComplete="name"
            placeholder="Haldun Mammadzada"
            required
          />
          <FieldErrors errors={state?.fieldErrors?.fullName} />
        </div>

        <div>
          <TextInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <FieldErrors errors={state?.fieldErrors?.email} />
        </div>

        <div>
          <TextInput
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
          />
          <FieldErrors errors={state?.fieldErrors?.password} />
        </div>

        <SubmitButton>Create account</SubmitButton>
      </form>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-400">
        By continuing you agree that your CV data is stored in the Supabase
        project configured for this deployment.
      </p>
    </div>
  );
}
