import { redirect } from "next/navigation";

// The feed now lives at /feed (app/(dashboard)/feed/page.tsx) as a Server
// Component that pre-fetches via Prisma directly. This root page just
// forwards there so "/" has somewhere sensible to land.
export default function HomePage() {
  redirect("/feed");
}