import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
        Sign in
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Pick up where you left off.
      </p>

      <div className="mt-7">
        <LoginForm next={params.next} initialError={params.error} />
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-500">
        No account yet?{" "}
        <Link
          href="/signup"
          className="font-medium text-ink-900 underline underline-offset-4 hover:text-brand-700"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
