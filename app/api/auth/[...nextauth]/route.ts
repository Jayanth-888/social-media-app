import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// This single file handles ALL auth routes: /api/auth/signin, /api/auth/callback,
// /api/auth/session, /api/auth/signout, etc. The [...nextauth] folder name
// is a "catch-all" dynamic segment — it captures every sub-path after /api/auth/.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
