import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Auth.js v5 config lives at the project root (not in /lib) by convention,
// because middleware.ts needs to import from it and root-level imports
// keep that path simple. This single call gives us everything:
// `handlers` (for the route handler), `auth` (replaces both
// `getServerSession` AND the old `withAuth` middleware helper),
// and `signIn` / `signOut` (server actions you can call from forms).
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt", // stateless — no Session table needed, works well on Vercel's edge/serverless functions
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        // Whatever is returned here becomes `user` in the jwt() callback below.
        // Never return the password hash.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.profileImage,
        };
      },
    }),
  ],
  callbacks: {
    // Runs whenever a JWT is created/updated. Persist the user id onto the token
    // so it survives across requests without hitting the database.
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    // Runs whenever a session is checked (useSession, auth()). Copy the id
    // from the token onto the session object so the app can use session.user.id.
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});