import { handlers } from "@/auth";

// Auth.js v5 pre-builds the GET/POST handlers for you (sign-in, callback,
// session, sign-out, csrf, etc.) — this file just re-exports them.
// Compare to v4, where you had to call NextAuth(authOptions) here directly;
// in v5 that call happens once in auth.ts so both this route AND
// middleware.ts can share the exact same config.
export const { GET, POST } = handlers;