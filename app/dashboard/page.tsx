import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserMenu } from "@/components/layout/user-menu";

// Server Component: no "use client" here. `auth()` runs on the server,
// reads the session straight from the request cookie/JWT, and this page
// never ships an extra client-side fetch just to know who's logged in.
//
// NOTE: middleware.ts already redirects unauthenticated requests away from
// /dashboard/*, so this check is technically redundant for humans clicking
// around — but middleware can be bypassed in edge cases (e.g. direct data
// fetches, misconfigured matchers), so re-checking here is cheap insurance.
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <UserMenu />
      </div>
      <p className="text-muted">
        Signed in as <span className="font-medium text-foreground">{session.user.email}</span>
      </p>
    </main>
  );
}