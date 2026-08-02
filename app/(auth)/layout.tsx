import BrandLink from "@/components/brand/BrandLink";
import { APP_NAME } from "@/lib/brand";

const HIGHLIGHTS = [
  {
    title: "Scored against real screening rules",
    body: "Thirty checks covering parseability, quantified impact, keyword density and length — with the exact fix for each one.",
  },
  {
    title: "Tailored per posting",
    body: "Paste a job description and see which of its keywords your CV is missing before a recruiter does.",
  },
  {
    title: "Exports that survive parsing",
    body: "Single-column PDF with embedded text, plus DOCX for the systems that still prefer Word.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(480px,42%)]">
      <aside className="hidden flex-col justify-between bg-ink-950 p-12 text-white lg:flex">
        <BrandLink href="/" variant="dark" size={52} prominent />

        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Applications get filtered by software before a person ever reads
            them.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            {APP_NAME} builds a CV that clears the filter and still reads like
            it was written for a human.
          </p>

          <dl className="mt-10 space-y-6">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title}>
                <dt className="text-sm font-medium text-white">{item.title}</dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-white/50">
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-xs text-white/30">
          {APP_NAME} — your data stays in your own Supabase project.
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center bg-white px-4 py-8 sm:px-6 sm:py-12">
        <BrandLink href="/" size={40} prominent hideTaglineOnMobile className="mb-6 sm:mb-8 lg:hidden" />
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
