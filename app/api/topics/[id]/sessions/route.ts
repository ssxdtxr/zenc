import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import { upgradeOnly, nextReviewAt } from "@/lib/subtopic-status"
import { logError } from "@/lib/log"
import type { SessionRecord } from "@/entities/topic/model/types"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const { id: topicId } = await params
    const results: Omit<SessionRecord, "id" | "date"> = await req.json()

    // Verify topic belongs to user
    const topic = await prisma.topic.findFirst({ where: { id: topicId, userId } })
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Save session
    const session = await prisma.session.create({
      data: {
        topicId,
        score: results.score,
        total: results.total,
        overallLevel: results.overallLevel,
        summary: results.summary,
        strengths: results.strengths,
        toStudyMore: results.toStudyMore,
        toStudyDeeper: results.toStudyDeeper,
      },
    })

    // Upsert subtopics — never downgrade an existing status
    const existingSubtopics = await prisma.topicSubtopic.findMany({
      where: { topicId, name: { in: results.subtopics.map((s) => s.name) } },
    })
    const existingByName = new Map(existingSubtopics.map((s) => [s.name, s.status]))

    await Promise.all(
      results.subtopics.map((s) => {
        const finalStatus = upgradeOnly(existingByName.get(s.name), s.status)
        return prisma.topicSubtopic.upsert({
          where: { topicId_name: { topicId, name: s.name } },
          update: { status: finalStatus, recommendation: s.recommendation, definitions: s.definitions ?? [], prerequisites: s.prerequisites ?? [], nextReviewAt: nextReviewAt(finalStatus) },
          create: { topicId, name: s.name, status: finalStatus, recommendation: s.recommendation, definitions: s.definitions ?? [], prerequisites: s.prerequisites ?? [], nextReviewAt: nextReviewAt(finalStatus) },
        })
      })
    )

    // Update topic level + lastSessionAt
    await prisma.topic.update({
      where: { id: topicId },
      data: { overallLevel: results.overallLevel, lastSessionAt: new Date() },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (err) {
    logError("topics/sessions", err, { userId })
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
