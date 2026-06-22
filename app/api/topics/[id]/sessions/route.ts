import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import type { SessionRecord } from "@/entities/topic/model/types"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getOrCreateUserId()
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

    // Upsert subtopics
    await Promise.all(
      results.subtopics.map((s) =>
        prisma.topicSubtopic.upsert({
          where: { topicId_name: { topicId, name: s.name } },
          update: { status: s.status, recommendation: s.recommendation },
          create: { topicId, name: s.name, status: s.status, recommendation: s.recommendation },
        })
      )
    )

    // Update topic level + lastSessionAt
    await prisma.topic.update({
      where: { id: topicId },
      data: { overallLevel: results.overallLevel, lastSessionAt: new Date() },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
