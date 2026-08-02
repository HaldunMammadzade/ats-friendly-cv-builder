"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { signInWithGoogle } from "@/app/auth/actions";

export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" loading={pending} className={`w-full ${className ?? ""}`}>
      {children}
    </Button>
  );
}

export function FormAlert({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;

  const isError = Boolean(error);
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px] leading-relaxed ${
        isError
          ? "border-danger/25 bg-danger/5 text-danger"
          : "border-pass/25 bg-pass/5 text-pass"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{error ?? message}</span>
    </div>
  );
}

export function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <ul className="mt-1.5 space-y-0.5">
      {errors.map((e) => (
        <li key={e} className="text-xs text-danger">
          {e}
        </li>
      ))}
    </ul>
  );
}

export function GoogleButton({ next }: { next?: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <GoogleSubmit />
    </form>
  );
}

/** Separate component so useFormStatus can read the enclosing form. */
function GoogleSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="lg"
      loading={pending}
      className="w-full"
      icon={<GoogleMark />}
    >
      Continue with Google
    </Button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14Z"
      />
    </svg>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11px] uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
