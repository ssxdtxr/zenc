import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import type { GlossaryTerm, SessionRecord } from "@/entities/topic/model/types"

function nextReviewAt(status: string): Date {
  const daysMap: Record<string, number> = {
    needs_work: 1,
    learning:   3,
    good:       7,
    expert:     21,
  }
  const days = daysMap[status] ?? 3
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getOrCreateUserId()
    const { id: topicId } = await params
    const results: Omit<SessionRecord, "id" | "date"> & { glossary?: GlossaryTerm[] } = await req.json()

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
          update: { status: s.status, recommendation: s.recommendation, definitions: s.definitions ?? [], nextReviewAt: nextReviewAt(s.status) },
          create: { topicId, name: s.name, status: s.status, recommendation: s.recommendation, definitions: s.definitions ?? [], nextReviewAt: nextReviewAt(s.status) },
        })
      )
    )

    // Upsert glossary terms
    if (results.glossary?.length) {
      await Promise.all(
        results.glossary.map((g) =>
          prisma.glossaryTerm.upsert({
            where: { topicId_term: { topicId, term: g.term } },
            update: { definition: g.definition },
            create: { topicId, term: g.term, definition: g.definition },
          })
        )
      )
    }

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
