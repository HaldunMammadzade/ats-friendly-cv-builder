import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Start building ATS-ready CVs with {APP_NAME}.
      </p>

      <div className="mt-7">
        <SignupForm />
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-ink-900 underline underline-offset-4 hover:text-brand-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
