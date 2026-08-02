"use client";

import { useActionState } from "react";
import { TextInput } from "@/components/ui/Field";
import {
  FieldErrors,
  FormAlert,
  SubmitButton,
} from "@/components/auth/AuthPieces";
import { updatePassword, type AuthState } from "@/app/auth/actions";

export default function ResetPasswordForm() {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    updatePassword,
    undefined
  );

  return (
    <div>
      <FormAlert error={state?.error} message={state?.message} />

      <form action={action} className="space-y-4">
        <div>
          <TextInput
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
          />
          <FieldErrors errors={state?.fieldErrors?.password} />
        </div>

        <div>
          <TextInput
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
          <FieldErrors errors={state?.fieldErrors?.confirmPassword} />
        </div>

        <SubmitButton>Update password</SubmitButton>
      </form>
    </div>
  );
}
