import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Daily Anthropic call cap per user, keyed by User.plan. Everyone is "beta"
// during the closed beta; add real tiers here once pricing is decided —
// no schema change needed, just a new entry.
export const PLAN_LIMITS: Record<string, number> = {
  beta: 50,
}
const DEFAULT_PLAN = "beta"

export function limitForPlan(plan: string): number {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS[DEFAULT_PLAN]
}

function todayUtc(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

async function incrementUsage(userId: string): Promise<number> {
  const usage = await prisma.aiUsageDaily.upsert({
    where: { userId_date: { userId, date: todayUtc() } },
    update: { count: { increment: 1 } },
    create: { userId, date: todayUtc(), count: 1 },
  })
  return usage.count
}

// Call once per Anthropic request, before making it. Returns a 429 response
// to short-circuit the route if the user is over their daily cap, else null.
export async function enforceAiUsageLimit(userId: string): Promise<NextResponse | null> {
  const [count, user] = await Promise.all([
    incrementUsage(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
  ])

  const limit = limitForPlan(user?.plan ?? DEFAULT_PLAN)
  if (count > limit) {
    return NextResponse.json(
      { error: `Дневной лимит запросов исчерпан (${limit}/день). Попробуй завтра.` },
      { status: 429 }
    )
  }
  return null
}
