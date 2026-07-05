import { DefaultSession } from "next-auth";

// Auth.js's default Session["user"] only has name/email/image.
// This augmentation adds `id` so `session.user.id` type-checks
// everywhere (Server Components, route handlers, client hooks).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}