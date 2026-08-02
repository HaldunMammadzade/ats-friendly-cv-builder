import Link from "next/link";
import {
  ArrowRight,
  FileDown,
  FileText,
  GitCompareArrows,
  History,
  ScanSearch,
  Upload,
} from "lucide-react";
import BrandLink from "@/components/brand/BrandLink";
import { APP_FOOTER, APP_NAME } from "@/lib/brand";
import { getUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Live ATS score",
    body: "Thirty weighted checks across contact details, structure, phrasing, keywords, formatting and length. Each failure names the specific bullet and the fix.",
  },
  {
    icon: GitCompareArrows,
    title: "Job-description matching",
    body: "Paste the posting. You get importance-ranked keywords, which ones you already cover, and which required terms are missing.",
  },
  {
    icon: FileDown,
    title: "PDF and DOCX export",
    body: "Single-column, real embedded text, no tables or images. DOCX for the older systems that still parse Word more reliably than PDF.",
  },
  {
    icon: Upload,
    title: "Import what you have",
    body: "Drop in an existing PDF or DOCX and it is parsed into editable fields — including a warning if the file is a scan an ATS could never read.",
  },
  {
    icon: History,
    title: "Versions per application",
    body: "Every editing session writes a restore point, and you can tailor a separate copy for each role without losing the original.",
  },
  {
    icon: FileText,
    title: "Cover letters from your own words",
    body: "Drafts are assembled from your strongest quantified bullets and the posting's language. Nothing is invented on your behalf.",
  },
];

const CHECKS = [
  "Bullets open with an action verb",
  "Half your bullets carry a number",
  "No filler like \"responsible for\"",
  "Dates parse as a clean range",
  "Standard section headings",
  "One page under ten years",
];

export default async function LandingPage() {
  const user = isSupabaseConfigured ? await getUser() : null;
  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Open your dashboard" : "Start building";

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-white">
      <header className="safe-top sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <BrandLink href="/" size={36} prominent hideTaglineOnMobile />

          <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-ink-900 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-ink-800 sm:px-4 sm:text-[13px]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-2.5 py-2 text-[12px] font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 sm:px-3 sm:text-[13px]"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-ink-900 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-ink-800 sm:px-4 sm:text-[13px]"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 md:pt-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-50 px-3 py-1 text-[11px] text-ink-600 sm:text-[12px]">
              <span className="h-1.5 w-1.5 rounded-full bg-pass" />
              Built for remote applications
            </span>

            <h1 className="mt-5 text-[32px] font-semibold leading-[1.1] tracking-tight text-ink-900 sm:mt-6 sm:text-[42px] sm:leading-[1.08] lg:text-[56px]">
              A resume that gets past the filter and still sounds like you.
            </h1>

            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-600 sm:mt-6 sm:text-[17px]">
              Most applications are ranked by software before a person sees
              them. This scores your CV against the rules those systems actually
              apply, tells you exactly what to change, and exports files that
              parse cleanly.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={primaryHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-ink-900 px-6 text-[15px] font-medium text-white transition-colors hover:bg-ink-800"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-6 text-[15px] font-medium text-ink-700 transition-colors hover:bg-ink-50"
              >
                I already have an account
              </Link>
            </div>

            <ul className="mt-8 grid gap-2 sm:mt-10 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              {CHECKS.map((check) => (
                <li
                  key={check}
                  className="flex items-center gap-2 text-[13px] text-ink-500"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pass/12 text-[10px] text-pass">
                    ✓
                  </span>
                  {check}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-line bg-ink-50/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
              What it actually does
            </h2>
            <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title}>
                  <feature.icon className="h-5 w-5 text-ink-400" />
                  <h3 className="mt-3 text-[15px] font-semibold text-ink-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="rounded-2xl bg-ink-950 px-5 py-10 sm:px-8 sm:py-12 md:px-12">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {APP_NAME} keeps your data in your own Supabase project.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
              Every table is protected by row level security keyed to your user
              ID. No third-party analytics on your CV contents, and no model
              call unless you ask for one.
            </p>
            <Link
              href={primaryHref}
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-[15px] font-medium text-ink-900 transition-colors hover:bg-white/90"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-[13px] text-ink-500">{APP_FOOTER}</p>
        </div>
      </footer>
    </div>
  );
}
