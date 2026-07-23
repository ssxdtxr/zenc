import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const DAILY_AI_CALL_LIMIT = 50

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
  const count = await incrementUsage(userId)
  if (count > DAILY_AI_CALL_LIMIT) {
    return NextResponse.json(
      { error: `Дневной лимит запросов исчерпан (${DAILY_AI_CALL_LIMIT}/день). Попробуй завтра.` },
      { status: 429 }
    )
  }
  return null
}
