import TopNav from "@/components/app/TopNav";
import { displayName, getProfile, requireUser } from "@/lib/auth/dal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proxy already gates these routes, but Server Functions rendered from here
  // are separate entry points, so the check is repeated close to the data.
  const user = await requireUser();
  const profile = await getProfile();

  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip">
      <TopNav name={displayName(user, profile)} email={user.email ?? ""} />
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
    </div>
  );
}
