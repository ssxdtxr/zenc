import { PrismaClient } from "@prisma/client"
import { PrismaNeonHttp } from "@prisma/adapter-neon"

// Side-effect-free operations only — safe to blindly retry once.
const RETRYABLE_OPERATIONS = new Set([
  "findMany", "findFirst", "findUnique", "findFirstOrThrow", "findUniqueOrThrow",
  "count", "aggregate", "groupBy",
])

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local")
  }
  // HTTP (fetch) transport instead of the WebSocket pool: one request per query,
  // no persistent socket to keep alive or reconnect — avoids the multi-second
  // hangs seen when the WebSocket handshake stalls after the Neon compute idles.
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL, {})
  const client = new (PrismaClient as new (args: Record<string, unknown>) => PrismaClient)({ adapter })

  // Neon's compute can be mid-wake from autosuspend when several queries land at
  // once — the first attempt or two may fail while it stabilizes. Backing off and
  // retrying rides out that window instead of surfacing a 500 to the user.
  const RETRY_DELAYS_MS = [300, 1500]

  return client.$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        if (!RETRYABLE_OPERATIONS.has(operation)) return query(args)
        for (const delay of RETRY_DELAYS_MS) {
          try {
            return await query(args)
          } catch {
            await sleep(delay)
          }
        }
        return query(args)
      },
    },
  })
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> }
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
