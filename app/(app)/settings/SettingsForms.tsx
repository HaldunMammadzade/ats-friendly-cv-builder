"use client";

import { useActionState } from "react";
import { updatePassword, updateProfile, type AuthState } from "@/app/auth/actions";
import { TextInput } from "@/components/ui/Field";
import { FieldErrors, FormAlert, SubmitButton } from "@/components/auth/AuthPieces";

export function ProfileForm({
  fullName,
  headline,
  email,
}: {
  fullName: string;
  headline: string;
  email: string;
}) {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    updateProfile,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <FormAlert error={state?.error} message={state?.message} />

      <TextInput
        label="Full name"
        name="fullName"
        defaultValue={fullName}
        placeholder="Haldun Mammadzada"
      />
      <FieldErrors errors={state?.fieldErrors?.fullName} />

      <TextInput
        label="Headline"
        name="headline"
        defaultValue={headline}
        placeholder="Senior Software Engineer"
        hint="Used as the default job title on new CVs."
      />
      <FieldErrors errors={state?.fieldErrors?.headline} />

      <TextInput label="Email" value={email} disabled readOnly />

      <SubmitButton>Save profile</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    updatePassword,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <FormAlert error={state?.error} message={state?.message} />
      <input type="hidden" name="next" value="/settings" />

      <TextInput
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <FieldErrors errors={state?.fieldErrors?.password} />

      <TextInput
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
      />
      <FieldErrors errors={state?.fieldErrors?.confirmPassword} />

      <SubmitButton>Update password</SubmitButton>
    </form>
  );
}
