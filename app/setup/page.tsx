import type { Metadata } from "next";
import { Database, KeyRound, ShieldCheck, Terminal } from "lucide-react";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: "Setup" };

const ENV_TEMPLATE = `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000`;

const STEPS = [
  {
    icon: Database,
    title: "Create a Supabase project",
    body: (
      <>
        Go to{" "}
        <a
          className="font-medium text-brand-700 underline underline-offset-4"
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
        >
          supabase.com/dashboard
        </a>{" "}
        and create a new project. Pick the region closest to you — it decides
        where your CV data physically lives.
      </>
    ),
  },
  {
    icon: Terminal,
    title: "Run the schema migration",
    body: (
      <>
        Open the SQL Editor in your project and paste the entire contents of{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">
          supabase/migrations/0001_init.sql
        </code>
        , then run it. This creates the tables, the row level security policies
        and the trigger that provisions a profile for each new user.
      </>
    ),
  },
  {
    icon: KeyRound,
    title: "Add your keys",
    body: (
      <>
        Copy{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">
          .env.example
        </code>{" "}
        to{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">
          .env.local
        </code>
        , then fill it in from Project Settings → API. Restart the dev server
        afterwards — Next.js only reads env files at boot.
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: "Configure auth redirects",
    body: (
      <>
        Under Authentication → URL Configuration, set the Site URL to your
        origin and add{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">
          http://localhost:3000/**
        </code>{" "}
        to Redirect URLs (wildcard covers callback and confirm). For Google
        sign-in, enable the Google provider and paste in your OAuth client ID
        and secret — see step 5 below.
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: "Email confirm → dashboard",
    body: (
      <>
        Authentication → Email Templates → <strong>Confirm signup</strong>.
        Replace the body with{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">
          supabase/email-templates/confirm-signup.html
        </code>{" "}
        so the link uses{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">
          {"{{ .ConfirmationURL }}"}
        </code>{" "}
        and lands on{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">
          /auth/callback
        </code>
        , then redirects to the dashboard.
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: "Google OAuth (optional)",
    body: (
      <>
        In{" "}
        <a
          className="font-medium text-brand-700 underline underline-offset-4"
          href="https://console.cloud.google.com/apis/credentials"
          target="_blank"
          rel="noreferrer"
        >
          Google Cloud Console
        </a>
        , create an OAuth client (Web application). Authorized redirect URI:{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">
          https://&lt;project-ref&gt;.supabase.co/auth/v1/callback
        </code>
        . Paste the Client ID and Secret into Supabase → Authentication →
        Providers → Google.
      </>
    ),
  },
];

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
        One-time setup
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
        Set up {APP_NAME}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
        {APP_NAME} has no Supabase credentials yet, so sign-in and saving are
        disabled. Four steps and you&apos;re done — plus Google OAuth and email
        templates if you want those.
      </p>

      <ol className="mt-10 space-y-7">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-500">
              <step.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 pt-1">
              <h2 className="text-sm font-semibold text-ink-900">
                {i + 1}. {step.title}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 overflow-hidden rounded-xl border border-line bg-ink-950">
        <div className="border-b border-white/10 px-4 py-2">
          <span className="font-mono text-[11px] text-white/50">.env.local</span>
        </div>
        <pre className="overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-white/80">
          {ENV_TEMPLATE}
        </pre>
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-ink-500">
        The anon key is safe to expose in the browser — row level security is
        what protects your data, and every table in the migration enforces it.
        Never put the service role key in a{" "}
        <code className="font-mono text-[12px]">NEXT_PUBLIC_</code> variable.
      </p>
    </main>
  );
}
