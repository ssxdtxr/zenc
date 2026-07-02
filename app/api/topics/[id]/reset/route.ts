import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getOrCreateUserId()
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
    console.error("Reset error:", err)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
