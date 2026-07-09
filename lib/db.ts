import { PrismaClient } from "@prisma/client";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500; // delay doubles-ish each retry: 500ms, 1000ms, 1500ms

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Neon's free tier suspends its compute after a few minutes idle. The
 * first query after that can fail with P1001 ("can't reach database
 * server") purely because the endpoint is still waking up — nothing
 * ever ran, so it's always safe to retry. This extension catches P1001
 * specifically and retries with a short backoff before giving up and
 * letting the error surface normally (so a genuinely broken DATABASE_URL
 * or a real outage still fails loudly, just after a few tries).
 */
function withColdStartRetry(client: PrismaClient) {
  return client.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        let attempt = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            return await query(args);
          } catch (error: any) {
            const isColdStart = error?.code === "P1001";
            attempt++;

            if (!isColdStart || attempt > MAX_RETRIES) {
              throw error;
            }

            const delay = BASE_DELAY_MS * attempt;
            console.warn(
              `[prisma] ${model}.${operation} hit P1001 (Neon cold start) — retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`
            );
            await wait(delay);
          }
        }
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof withColdStartRetry> | undefined;
};

// If your existing lib/db.ts passed options into `new PrismaClient({...})`
// (e.g. `log: ["query", "error"]` — which is what was producing the
// `prisma:query` lines in your terminal), keep them by merging here:
//   new PrismaClient({ log: ["query", "error"] })
export const db =
  globalForPrisma.prisma ?? withColdStartRetry(new PrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}