import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import { upgradeOnly, nextReviewAt } from "@/lib/subtopic-status"
import { logError } from "@/lib/log"
import type { SubtopicStatus } from "@/entities/topic/model/types"

// Maps difficulty + isComplete → subtopic status
const STATUS_MAP: Record<string, { complete: SubtopicStatus; incomplete: SubtopicStatus }> = {
  basic:        { complete: "learning",  incomplete: "needs_work" },
  intermediate: { complete: "good",      incomplete: "learning"   },
  advanced:     { complete: "expert",    incomplete: "good"       },
}

export async function POST(req: NextRequest) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const { topicId, subtopicName, difficulty, isComplete, finishSummary } = await req.json()

    const topic = await prisma.topic.findFirst({ where: { id: topicId, userId } })
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const map = STATUS_MAP[difficulty] ?? STATUS_MAP.basic
    const newStatus = isComplete ? map.complete : map.incomplete

    const existing = await prisma.topicSubtopic.findFirst({ where: { topicId, name: subtopicName } })
    const finalStatus = upgradeOnly(existing?.status, newStatus)

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
    logError("level-session-eval", err, { userId })
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
