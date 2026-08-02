import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
        Reset your password
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
        Enter the address you signed up with and we&apos;ll send a reset link.
      </p>

      <div className="mt-7">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-500">
        <Link
          href="/login"
          className="font-medium text-ink-900 underline underline-offset-4 hover:text-brand-700"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
