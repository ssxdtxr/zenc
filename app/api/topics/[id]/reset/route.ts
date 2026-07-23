import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import { logError } from "@/lib/log"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const { id } = await params

    const topic = await prisma.topic.findFirst({ where: { id, userId } })
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.topicSubtopic.deleteMany({ where: { topicId: id } })
    await prisma.topic.update({
      where: { id },
      data: { overallLevel: "beginner", lastSessionAt: null },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logError("topics/reset", err, { userId })
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
