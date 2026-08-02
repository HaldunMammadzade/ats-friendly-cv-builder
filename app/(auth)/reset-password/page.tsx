import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
        Choose a new password
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
        You reached this page from a valid reset link, so you&apos;re already
        signed in. Set a new password to finish.
      </p>

      <div className="mt-7">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
