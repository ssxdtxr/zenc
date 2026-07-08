import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"

// Maps difficulty + isComplete → subtopic status
const STATUS_MAP: Record<string, { complete: string; incomplete: string }> = {
  basic:        { complete: "learning",  incomplete: "needs_work" },
  intermediate: { complete: "good",      incomplete: "learning"   },
  advanced:     { complete: "expert",    incomplete: "good"       },
}

const STATUS_ORDER = ["needs_work", "learning", "good", "expert"]

function nextReviewAt(status: string): Date {
  const days: Record<string, number> = { needs_work: 1, learning: 3, good: 7, expert: 21 }
  const d = new Date()
  d.setDate(d.getDate() + (days[status] ?? 3))
  return d
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getOrCreateUserId()
    const { topicId, subtopicName, difficulty, isComplete, finishSummary } = await req.json()

    const topic = await prisma.topic.findFirst({ where: { id: topicId, userId } })
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const map = STATUS_MAP[difficulty] ?? STATUS_MAP.basic
    const newStatus = isComplete ? map.complete : map.incomplete

    // Only upgrade, never downgrade existing status
    const existing = await prisma.topicSubtopic.findFirst({ where: { topicId, name: subtopicName } })
    const existingIdx = STATUS_ORDER.indexOf(existing?.status ?? "needs_work")
    const newIdx = STATUS_ORDER.indexOf(newStatus)
    const finalStatus = newIdx > existingIdx ? newStatus : (existing?.status ?? newStatus)

    await prisma.topicSubtopic.updateMany({
      where: { topicId, name: subtopicName },
      data: {
        status: finalStatus,
        recommendation: finishSummary ?? "",
        nextReviewAt: nextReviewAt(finalStatus),
      },
    })

    return NextResponse.json({ status: finalStatus })
  } catch (err) {
    console.error("Level session eval error:", err)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
