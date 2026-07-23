import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOrCreateUserId } from "@/lib/user-id"
import { logError } from "@/lib/log"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const { id } = await params

    const topic = await prisma.topic.findFirst({
      where: { id, userId },
      include: {
        subtopics: true,
        sessions: { orderBy: { date: "desc" } },
      },
    })

    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(topic)
  } catch (err) {
    logError("topics/get", err, { userId })
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string | undefined
  try {
    userId = await getOrCreateUserId()
    const { id } = await params

    await prisma.topic.deleteMany({ where: { id, userId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError("topics/delete", err, { userId })
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
