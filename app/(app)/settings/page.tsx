import type { Metadata } from "next";
import { requireUser, getProfile } from "@/lib/auth/dal";
import { PasswordForm, ProfileForm } from "./SettingsForms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfile();

  const hasPasswordIdentity =
    user.identities?.some((identity) => identity.provider === "email") ?? true;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-5 sm:py-8">
      <h1 className="text-xl font-semibold tracking-tight text-ink-900">
        Settings
      </h1>

      <section className="mt-6 rounded-xl border border-line bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-900">Profile</h2>
        <p className="mb-4 mt-1 text-[13px] leading-relaxed text-ink-500">
          These details pre-fill new CVs. They are not shown to anyone else.
        </p>
        <ProfileForm
          fullName={profile?.full_name ?? ""}
          headline={profile?.headline ?? ""}
          email={user.email ?? ""}
        />
      </section>

      <section className="mt-4 rounded-xl border border-line bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-900">Password</h2>
        <p className="mb-4 mt-1 text-[13px] leading-relaxed text-ink-500">
          {hasPasswordIdentity
            ? "Choose something at least 8 characters long with a number."
            : "You signed in with Google. Setting a password here adds email sign-in as a second way into this account."}
        </p>
        <PasswordForm />
      </section>

      <section className="mt-4 rounded-xl border border-line bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-900">Your data</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
          Everything you write in Folio is stored under your own account and
          protected by row-level security in the database, meaning no other
          user&apos;s session can read it even if they know the record ID.
          Deleting a CV removes its version history with it.
        </p>
      </section>
    </div>
  );
}
