"use client";

import { useActionState } from "react";
import { TextInput } from "@/components/ui/Field";
import { FormAlert, SubmitButton } from "@/components/auth/AuthPieces";
import { requestPasswordReset, type AuthState } from "@/app/auth/actions";

export default function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    requestPasswordReset,
    undefined
  );

  return (
    <div>
      <FormAlert error={state?.error} message={state?.message} />
      <form action={action} className="space-y-4">
        <TextInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <SubmitButton>Send reset link</SubmitButton>
      </form>
    </div>
  );
}
